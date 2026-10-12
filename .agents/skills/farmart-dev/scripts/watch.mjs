/**
 * The loop: re-scan the source tree and refresh SKILL.md every minute.
 *
 *   npm run skill:watch                     # 1 min, the default
 *   npm run skill:watch -- --interval 300   # any other interval, in seconds
 *
 * Design notes worth keeping if you edit this:
 *
 * - It ticks on a timer, not on file events. A watcher would fire in bursts during
 *   an edit session and rewrite the doc mid-refactor; a fixed interval produces one
 *   coherent snapshot and is predictable in a log.
 *
 * - A tick that finds nothing changed does nothing. No mtime bump, no git noise, no
 *   token cost for an idle repo. That is the whole reason the render step compares
 *   before it writes — at a one-minute cadence a whole edit burst lands inside a
 *   single tick, so most ticks are "no change" and cost one stat sweep.
 *
 * - `--once` runs a single pass and exits, which is what a CI job or a pre-commit hook
 *   wants. It shares this file so the two paths cannot drift.
 *
 * Output is line-buffered and flushed per tick, so `npm run skill:watch` is readable in
 * a terminal and pipeable to a file.
 */

import process from "node:process"

import { sync } from "./sync.mjs"

const DEFAULT_INTERVAL_SECONDS = 60

function parseArgs(argv) {
  const options = { intervalMs: DEFAULT_INTERVAL_SECONDS * 1000, once: false, quiet: false }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === "--once") {
      options.once = true
    } else if (arg === "--quiet") {
      options.quiet = true
    } else if (arg === "--interval") {
      const seconds = Number(argv[index + 1])
      if (!Number.isFinite(seconds) || seconds <= 0) {
        throw new Error("--interval needs a positive number of seconds")
      }
      options.intervalMs = seconds * 1000
      index += 1
    } else if (arg.startsWith("--interval=")) {
      const seconds = Number(arg.slice("--interval=".length))
      if (!Number.isFinite(seconds) || seconds <= 0) {
        throw new Error("--interval needs a positive number of seconds")
      }
      options.intervalMs = seconds * 1000
    } else {
      throw new Error(`unknown argument: ${arg}`)
    }
  }

  return options
}

const tick = (index) =>
  sync({ quiet: true })
    .then((result) => {
      const time = new Date().toTimeString().slice(0, 8)
      console.log(
        `[farmart-dev] ${time} tick ${index} ${result.changed ? "updated" : "no change"}`,
      )
    })
    .catch((error) => {
      // A failed tick must not kill the loop: the next one may well succeed, and a
      // half-edited file elsewhere in the tree is a transient condition, not a bug
      // in the doc generator.
      console.error(`[farmart-dev] tick ${index} failed: ${error.message}`)
    })

let options
try {
  options = parseArgs(process.argv.slice(2))
} catch (error) {
  // A mistyped flag should read as a sentence, not a stack trace.
  console.error(`[farmart-dev] ${error.message}`)
  console.error("Usage: npm run skill:watch -- [--interval <seconds>] [--once] [--quiet]")
  process.exit(2)
}

if (options.once) {
  tick(1)
} else {
  const minutes = (options.intervalMs / 60000).toFixed(options.intervalMs % 60000 ? 1 : 0)
  console.log(
    `[farmart-dev] watching, every ${minutes} min. Ctrl-C to stop; the doc is updated only on change.`,
  )

  let index = 0
  const loop = () => {
    index += 1
    tick(index).finally(() => {
      timer = setTimeout(loop, options.intervalMs)
    })
  }

  // `setInterval` would overlap a slow tick with the next one; chaining through
  // setTimeout after the pass resolves cannot.
  let timer = setTimeout(loop, options.intervalMs)

  const stop = () => {
    clearTimeout(timer)
    console.log("[farmart-dev] stopped")
    process.exit(0)
  }

  process.on("SIGINT", stop)
  process.on("SIGTERM", stop)
}