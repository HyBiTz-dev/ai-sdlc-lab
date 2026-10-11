// OpenCode plugin: block destructive recursive force-deletes (`rm -rf`) in shell tools.
//
// Throwing from the hook aborts the tool call and sends the message back to the
// model, so the agent sees *why* the command was rejected and can pick another
// route instead of retrying the same thing.
//
// Loaded automatically from .opencode/plugins/.

const SHELL_TOOLS = new Set(["bash", "shell"])

/** The slice of the OpenCode plugin context this plugin uses. */
type PluginContext = {
  tool: { hook(name: "execute.before", callback: (event: ToolEvent) => void): unknown }
}

type ToolEvent = {
  tool: string
  input?: Record<string, unknown>
}

// Wrappers and env assignments that may sit in front of the real binary.
const WRAPPERS = new Set(["sudo", "doas", "command", "exec", "nohup", "time", "env", "xargs"])

export const BlockRmRf = {
  id: "farmart.block-rm-rf",
  setup(ctx: PluginContext) {
    return ctx.tool.hook("execute.before", (event: ToolEvent) => {
      if (!SHELL_TOOLS.has(event.tool)) return

      const command = typeof event.input?.command === "string" ? event.input.command : ""
      if (!command) return

      const segment = splitCommands(command).find(isRecursiveForceRm)
      if (!segment) return

      throw new Error(
        [
          "Blocked: recursive force-delete (`rm -rf`) is not allowed in this project.",
          `Rejected fragment: ${segment}`,
          "Use a targeted delete (`rm <file>`), `npm run db:reset`, or",
          "node .agents/skills/onboard/scripts/seed-db.mjs for the database.",
        ].join(" "),
      )
    })
  },
}

// Split on shell control operators so `echo hi && rm -rf x` is caught too.
// Quoted segments are collapsed to placeholders first so a `;` inside quotes
// does not split, and backslash escapes are dropped.
function splitCommands(command: string) {
  return command
    .replace(/\\./g, "")
    .replace(/'[^']*'/g, "''")
    .replace(/"[^"]*"/g, '""')
    .split(/[;&|\n()]+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function isRecursiveForceRm(part: string) {
  const tokens = part.split(/\s+/)
  let start = 0

  while (start < tokens.length) {
    const binary = tokens[start].split("/").pop()!
    if (binary === "rm") break
    if (WRAPPERS.has(binary) || /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[start])) {
      start += 1
      continue
    }
    return false
  }

  if (start >= tokens.length) return false

  let recursive = false
  let force = false
  let endOfFlags = false

  for (const token of tokens.slice(start + 1)) {
    if (endOfFlags) break
    if (token === "--") {
      endOfFlags = true
      continue
    }
    if (!token.startsWith("-") || token === "-") break // operands start here
    const isLong = token.startsWith("--")
    const flags = (isLong ? token.slice(2) : token.slice(1)).toLowerCase()
    if (isLong ? flags.includes("recursive") : flags.includes("r")) recursive = true
    if (isLong ? flags.includes("force") : flags.includes("f")) force = true
  }

  return recursive && force
}

export default BlockRmRf
