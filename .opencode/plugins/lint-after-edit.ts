// OpenCode plugin: run the linter after each round of code changes.
//
// Two passes, because each catches what the other misses:
//
//   scoped  - `eslint` on just the files the agent wrote/edited/patched,
//             debounced so a burst of edits in one turn costs a single run.
//             Cheap, and points straight at the line that was just changed.
//   project - the full `npm run lint` once the session goes idle. Catches
//             cross-file breakage (a deleted export, a bad import) that a
//             per-file pass cannot see.
//
// A failing run is injected back into the session as a synthetic message so
// the agent can fix it in the same turn. Round-capped: a rule the agent keeps
// "fixing" the same way, or an error it cannot fix, must not loop forever.
//
// Loaded automatically from .opencode/plugins/.

import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import path from "node:path"

const CODE_TOOLS = new Set(["write", "edit", "patch"])
const LINTABLE = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/

// Quiet period after the last edit before the scoped run fires. Long enough to
// swallow a multi-file edit burst, short enough to stay inside the turn.
const SETTLE_MS = 1_200

// Auto-fix rounds per session before the plugin stops asking. Reset whenever a
// run comes back clean.
const MAX_ROUNDS = 3

// An injected message longer than this is truncated; the agent can re-run
// `npm run lint` for the rest.
const MAX_REPORT_CHARS = 4_000

/** The slice of the OpenCode plugin context this plugin uses. */
type PluginContext = {
  location?: { directory?: string }
  tool: { hook(name: "execute.after", callback: (event: ToolEvent) => void): unknown }
  event: { subscribe(options?: { signal?: AbortSignal }): AsyncIterable<ServerEvent> }
  session: { synthetic(input: { sessionID: string; text: string }): Promise<unknown> }
}

type ToolEvent = {
  tool: string
  sessionID: string
  status: string
  input?: Record<string, unknown>
}

type ServerEvent = {
  type: string
  properties?: { sessionID?: string }
}

type SessionState = {
  /** Files touched since the last lint pass, awaiting a scoped run. */
  pending: Set<string>
  /** Whether any code file was touched at all, so idle knows to run. */
  dirty: boolean
  timer?: ReturnType<typeof setTimeout>
  /** Serialises passes so a scoped run and an idle run cannot overlap. */
  queue: Promise<void>
  /** Consecutive failing auto-fix rounds. */
  rounds: number
  /** Last injected report, so an identical failure is not reported twice. */
  lastReport?: string
}

export const LintAfterEdit = {
  id: "farmart.lint-after-edit",

  setup(ctx: PluginContext) {
    const cwd: string = ctx.location?.directory ?? process.cwd()
    const eslint = path.join(cwd, "node_modules", ".bin", "eslint")
    const sessions = new Map<string, SessionState>()

    if (!existsSync(eslint)) {
      console.warn("[lint-after-edit] no eslint binary under node_modules/.bin; hook disabled")
      return
    }

    function state(sessionID: string): SessionState {
      let entry = sessions.get(sessionID)
      if (!entry) {
        entry = { pending: new Set(), dirty: false, queue: Promise.resolve(), rounds: 0 }
        sessions.set(sessionID, entry)
      }
      return entry
    }

    // eslint exits non-zero on errors only; warnings do not fail the run.
    function run(targets: string[]): Promise<{ code: number; output: string }> {
      return new Promise((resolve) => {
        execFile(eslint, ["--format", "stylish", ...targets], { cwd, maxBuffer: 8 * 1024 * 1024 }, (error, stdout, stderr) => {
          const raw = (error as (Error & { code?: unknown }) | null)?.code
          const code = typeof raw === "number" ? raw : error ? 1 : 0
          resolve({ code, output: `${stdout}${stderr}`.trim() })
        })
      })
    }

    async function report(entry: SessionState, sessionID: string, scope: string, output: string) {
      if (entry.rounds >= MAX_ROUNDS) {
        console.warn(`[lint-after-edit] ${scope} lint still failing after ${MAX_ROUNDS} rounds; not asking again`)
        return
      }
      if (entry.lastReport === output) return

      entry.rounds += 1
      entry.lastReport = output
      const body = output.length > MAX_REPORT_CHARS ? `${output.slice(0, MAX_REPORT_CHARS)}\n… truncated` : output

      try {
        await ctx.session.synthetic({
          sessionID,
          text: [
            scope === "project"
              ? "ESLint fails on the project after your changes:"
              : "ESLint fails on the file(s) you just changed:",
            "",
            body,
            "",
            "Fix these before you finish. If a rule genuinely does not fit this codebase, say so instead of disabling it silently.",
          ].join("\n"),
        })
      } catch (error) {
        console.warn(`[lint-after-edit] could not deliver report: ${error}`)
      }
    }

    // Scoped pass: lint only the files touched in this burst.
    async function scoped(s: SessionState, sessionID: string) {
      const files = [...s.pending]
      if (files.length === 0) return
      s.pending.clear()

      const { code, output } = await run(files)
      if (code === 0) {
        s.rounds = 0
        s.lastReport = undefined
        return
      }
      await report(s, sessionID, "scoped", output)
    }

    function scheduleScoped(sessionID: string) {
      const s = state(sessionID)
      if (s.timer) clearTimeout(s.timer)
      s.timer = setTimeout(() => {
        s.timer = undefined
        s.queue = s.queue.then(() => scoped(s, sessionID))
      }, SETTLE_MS)
    }

    // Full-project pass once the turn ends.
    async function project(s: SessionState, sessionID: string) {
      if (!s.dirty) {
        sessions.delete(sessionID)
        return
      }
      s.dirty = false

      const { code, output } = await run([])
      if (code === 0) {
        s.rounds = 0
        s.lastReport = undefined
        sessions.delete(sessionID)
        return
      }
      await report(s, sessionID, "project", output)
      sessions.delete(sessionID)
    }

    ctx.tool.hook("execute.after", (event: ToolEvent) => {
      if (event.status !== "completed") return
      if (!CODE_TOOLS.has(event.tool)) return

      const touched = changedFiles(event.tool, event.input, cwd)
      if (touched.length === 0) return

      const s = state(event.sessionID)
      for (const file of touched) s.pending.add(file)
      s.dirty = true
      scheduleScoped(event.sessionID)
    })

    const controller = new AbortController()
    void (async () => {
      try {
        for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
          if (event.type !== "session.idle") continue
          const sessionID = event.properties?.sessionID
          if (!sessionID || !sessions.has(sessionID)) continue

          const s = state(sessionID)
          // The idle pass covers every pending file, so cancel the scoped one.
          if (s.timer) {
            clearTimeout(s.timer)
            s.timer = undefined
          }
          s.pending.clear()
          s.queue = s.queue.then(() => project(s, sessionID))
        }
      } catch (error) {
        if (!isAbort(error)) console.warn(`[lint-after-edit] event stream ended: ${error}`)
      }
    })()

    return () => controller.abort()
  },
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError"
}

// Files a tool call touched, resolved against the project root.
function changedFiles(tool: string, input: Record<string, unknown> | undefined, cwd: string): string[] {
  const paths: string[] = []

  if (tool === "patch") {
    // "*** Add File: src/a.ts" / "*** Update File: ..." / "*** Delete File: ..."
    const text = typeof input?.patchText === "string" ? input.patchText : ""
    for (const line of text.split("\n")) {
      const match = /^\*\*\* (?:Add|Update|Delete) File:\s*(.+?)\s*$/.exec(line)
      if (match) paths.push(match[1])
    }
  } else {
    const file = typeof input?.path === "string" ? input.path : ""
    if (file) paths.push(file)
  }

  return paths.filter((file) => LINTABLE.test(file)).map((file) => path.resolve(cwd, file))
}

export default LintAfterEdit