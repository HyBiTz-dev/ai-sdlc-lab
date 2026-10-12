/**
 * Fails when SKILL.md's auto-generated section no longer matches the source tree.
 *
 *   npm run skill:verify        # exit 1 with a summary of what drifted
 *   npm run skill:verify --fix  # rewrite it and exit 0
 *
 * This is the CI / pre-commit form of the loop: same scanner, same renderer, but
 * non-destructive by default. It exists so a stale snapshot is caught by a pipeline
 * rather than by someone noticing the numbers drifted three commits ago.
 *
 * Exit codes: 0 current (or fixed), 1 stale.
 */

import fs from "node:fs"
import path from "node:path"
import process from "node:process"

import { renderSection } from "./scan.mjs"
import { BEGIN, contentOf, currentSection, scan, SKILL, splice, stamp } from "./sync.mjs"

const fix = process.argv.includes("--fix")
const root = process.cwd()
const current = fs.readFileSync(path.join(root, SKILL), "utf8")

const facts = await scan(root)
const section = stamp(renderSection(facts), currentSection(current), facts.generatedAt)
const expected = splice(current, section)

// Compare content, not the stamp. The clock ticking past a minute is not the source
// tree changing, and a check that fails on that teaches people to ignore it.
if (contentOf(currentSection(expected)) === contentOf(currentSection(current))) {
  console.log(`[farmart-dev] ${SKILL} is current`)
  process.exit(0)
}

if (fix) {
  fs.writeFileSync(path.join(root, SKILL), expected)
  console.log(`[farmart-dev] rewrote the auto-generated section of ${SKILL}`)
  process.exit(0)
}

// Diff the marked region only, so the report names the table rows that moved
// instead of dumping the whole generated section twice.
const region = (text) => text.slice(text.indexOf(BEGIN))
const before = region(current).split("\n")
const after = region(expected).split("\n")

const added = after.filter((line) => !before.includes(line)).map((line) => `  + ${line}`)
const removed = before.filter((line) => !after.includes(line)).map((line) => `  - ${line}`)
const changes = [...added, ...removed]

console.error(`[farmart-dev] ${SKILL} is stale. Run \`npm run skill:sync\` to refresh.`)
if (changes.length) console.error(changes.slice(0, 20).join("\n"))
process.exit(1)