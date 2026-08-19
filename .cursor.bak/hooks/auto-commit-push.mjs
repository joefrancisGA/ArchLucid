#!/usr/bin/env node
/**
 * Runs when the Agent loop ends (`stop`). If the run completed successfully and the
 * worktree has changes, stages all, commits, and pushes.
 *
 * Disable: set environment variable ARCHLUCID_DISABLE_AUTO_COMMIT=1 (e.g. in shell profile).
 *
 * Cautions: commits every dirty worktree after a completed agent turn (including unrelated
 * local edits). Ensure secrets are gitignored. Push requires a configured remote and auth.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";

if (process.env.ARCHLUCID_DISABLE_AUTO_COMMIT === "1") {
  process.stdout.write("{}\n");
  process.exit(0);
}

const raw = fs.readFileSync(0, "utf8").trim();
let data = {};

try {
  data = raw ? JSON.parse(raw) : {};
} catch {
  process.stdout.write("{}\n");
  process.exit(0);
}

if (data.status !== "completed") {
  process.stdout.write("{}\n");
  process.exit(0);
}

function runGit(args) {
  return spawnSync("git", args, {
    encoding: "utf8",
    cwd: process.cwd(),
    shell: false,
  });
}

const por = runGit(["status", "--porcelain"]);

if (por.status !== 0) {
  console.error("[auto-commit] git status failed:", por.stderr || por.stdout);
  process.stdout.write("{}\n");
  process.exit(0);
}

if (!por.stdout.trim()) {
  process.stdout.write("{}\n");
  process.exit(0);
}

const add = runGit(["add", "-A"]);

if (add.status !== 0) {
  console.error("[auto-commit] git add failed:", add.stderr || add.stdout);
  process.stdout.write("{}\n");
  process.exit(0);
}

const iso = new Date().toISOString();
const msg = `chore: auto-commit after Cursor agent (${iso})`;
const commit = runGit(["commit", "-m", msg]);

if (commit.status !== 0) {
  console.error("[auto-commit] git commit failed:", commit.stderr || commit.stdout);
  process.stdout.write("{}\n");
  process.exit(0);
}

const push = runGit(["push"]);

if (push.status !== 0)
  console.error("[auto-commit] git push failed:", push.stderr || push.stdout);

process.stdout.write("{}\n");
process.exit(0);
