#!/usr/bin/env node
/**
 * Bulk-replace "governance" wording in user-facing string literals under archlucid-ui.
 * Skips URL paths (/governance/), help slugs (governance-approval), and import paths.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const TARGET_DIRS = [
  path.join(ROOT, "src"),
  path.join(ROOT, "public"),
];

const SKIP_FILE_PATTERNS = [
  /schemas\.generated/,
  /paths\.generated/,
  /help-index\.generated/,
  /\.snap$/,
  /remove-governance-user-facing-copy\.mjs$/,
];

/** Longest phrases first — order matters. */
const REPLACEMENTS = [
  ["Governance approval workflow", "Approval workflow"],
  ["governance approval workflow", "approval workflow"],
  ["Governance approval request", "Approval request"],
  ["governance approval request", "approval request"],
  ["Governance approval recorded", "Approval recorded"],
  ["Governance approval requested", "Approval requested"],
  ["Governance approval rejected", "Approval rejected"],
  ["Governance approval approved", "Approval granted"],
  ["Governance approval completed", "Approval completed"],
  ["How governance approval works", "How approval works"],
  ["Submit for governance approval", "Submit for approval"],
  ["Governance approval help", "Approval help"],
  ["Open governance approval", "Open approval"],
  ["View governance approval", "View approval"],
  ["Continue to governance approval", "Continue to approval"],
  ["Skip to governance approval workspace", "Skip to approval workspace"],
  ["Governance approval", "Approval"],
  ["governance approval", "approval"],
  ["Governance controls", "Approval controls"],
  ["governance controls", "approval controls"],
  ["Governance activity", "Approval activity"],
  ["governance activity", "approval activity"],
  ["Governance workflow", "Approval workflow"],
  ["governance workflow", "approval workflow"],
  ["governance checks", "approval checks"],
  ["governance records", "approval records"],
  ["governance status", "approval status"],
  ["governance decisions", "approval decisions"],
  ["governance orientation", "approval orientation"],
  ["governance release", "approval release"],
  ["governance review", "approval review"],
  ["governance packs", "policy packs"],
  ["governance pack", "policy pack"],
  ["governance-blocking", "policy-blocking"],
  ["Governance-blocking", "Policy-blocking"],
  ["governance warnings", "approval warnings"],
  ["governance warning", "approval warning"],
  ["Model governance", "Model policy"],
  ["model governance", "model policy"],
  ["AI and model governance", "AI and model policy"],
  ["Show governance, audit & admin controls", "Show audit & admin controls"],
  ["through governance", "through approval"],
  ["Architecture review governance", "Architecture review policies"],
  ["governance view", "approval view"],
  ["Governance view", "Approval view"],
  ["governed architecture review", "formal architecture review"],
  ["Governed architecture review", "Formal architecture review"],
  ["governed architecture package", "formal architecture package"],
  ["Governed architecture package", "Formal architecture package"],
  ["governed architecture packages", "formal architecture packages"],
  ["governed review", "formal review"],
  ["Governed review", "Formal review"],
  ["born-governed", "approval-ready"],
  ["governed follow-up", "formal follow-up"],
  ["governed follow-ups", "formal follow-ups"],
  ["governed assurance", "formal assurance"],
  ["governed use", "approved use"],
  ["Governed use", "Approved use"],
  ["governed sample review", "formal sample review"],
  ["inspect a governed sample review", "inspect a formal sample review"],
  ["Explore one governed architecture review", "Explore one formal architecture review"],
  ["governed outcomes", "formal outcomes"],
  ["governance records", "approval records"],
  ["governance mode", "approval view mode"],
  ["Governance mode", "Approval view mode"],
  ["governance findings", "policy findings"],
  ["Governance findings", "Policy findings"],
  ["governance disposition", "approval disposition"],
  ["governance gate", "approval gate"],
  ["governance setup", "approval setup"],
  ["Governance setup", "Approval setup"],
  ["governance dashboard", "approval dashboard"],
  ["Governance dashboard", "Approval dashboard"],
  ["governance resolution", "policy resolution"],
  ["Governance resolution", "Policy resolution"],
  ["governance mutations", "approval mutations"],
  ["Governance dry-run", "Policy dry-run"],
  ["governance dry-run", "policy dry-run"],
  ["governance dry-runs", "policy dry-runs"],
  ["governance digests", "scheduled digests"],
  ["governance does not depend", "approvals do not depend"],
  ["governance evidence bundle", "approval evidence bundle"],
  ["governance leads", "approval leads"],
  ["linked governance surfaces", "linked approval surfaces"],
  ["governance surfaces", "approval surfaces"],
  ["Prompt governance", "Prompt policy"],
  ["prompt governance", "prompt policy"],
  ["All governance", "All policy areas"],
  ["Insights, Compare, and Governance", "Insights, Compare, and Approval"],
  ["governance risks", "policy risks"],
  ["governance signals", "approval signals"],
  ["governance evidence", "approval evidence"],
  ["architecture and governance leaders", "architecture and approval leaders"],
  ["basic governance", "basic approval controls"],
  ["architecture, governance, or industry", "architecture, approval, or industry"],
  ["governance alert", "approval alert"],
  ["governance evaluation", "policy evaluation"],
  ["governance registry", "policy registry"],
  ["review / governance / alert", "review / approval / alert"],
  ["governance sections", "policy sections"],
  ["governance section", "policy section"],
  ['layerBadge: "Governance"', 'layerBadge: "Approval"'],
  ["governance records", "approval records"],
  ["governance status", "approval status"],
  ["governance leaders", "approval leaders"],
  ["evidence, governance, and", "evidence, approval, and"],
  ["reviews, evidence, governance,", "reviews, evidence, approval,"],
  ["roles, governance, policy", "roles, approval, policy"],
  ["for governance alert delivery", "for approval alert delivery"],
  ["governance dry-run simulation", "policy dry-run simulation"],
  ["governance dry-run notes", "policy dry-run notes"],
  ["governance dry-run delta", "policy dry-run delta"],
  ["themeSummaries\": [\"Governance\"", "themeSummaries\": [\"Approval\""],
  ["Governance\", \"Cost posture\"", "Approval\", \"Cost posture\""],
  ["targetBuyer\": \"AI governance", "targetBuyer\": \"AI policy"],
  ["No governance-blocking findings", "No policy-blocking findings"],
  ["governance-blocking findings", "policy-blocking findings"],
  ["governance evaluation code paths", "policy evaluation code paths"],
];

function shouldSkipFile(filePath) {
  return SKIP_FILE_PATTERNS.some((pattern) => pattern.test(filePath));
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") {
        continue;
      }
      walk(full, files);
    } else if (/\.(ts|tsx|json|md)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function transformContent(content) {
  let next = content;
  for (const [from, to] of REPLACEMENTS) {
    next = next.split(from).join(to);
  }
  return next;
}

let changedFiles = 0;

for (const dir of TARGET_DIRS) {
  if (!fs.existsSync(dir)) {
    continue;
  }

  for (const file of walk(dir)) {
    if (shouldSkipFile(file)) {
      continue;
    }

    const original = fs.readFileSync(file, "utf8");
    const updated = transformContent(original);

    if (updated !== original) {
      fs.writeFileSync(file, updated, "utf8");
      changedFiles += 1;
      console.log(path.relative(ROOT, file));
    }
  }
}

console.log(`\nUpdated ${changedFiles} file(s).`);
