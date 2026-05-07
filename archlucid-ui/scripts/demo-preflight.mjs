#!/usr/bin/env node
/**
 * Demo-readiness preflight: validates that the current build/env is safe to show to buyers.
 *
 * Usage:
 *   node scripts/demo-preflight.mjs               # check env vars in current shell
 *   DEMO_PREFLIGHT_RELAXED=1 node scripts/demo-preflight.mjs
 *   node scripts/demo-preflight.mjs --relaxed
 *
 * Exit 0 = all checks passed. Exit 1 = one or more checks failed.
 *
 * Run as part of a CI pre-deploy gate or before handing a demo URL to a buyer.
 */

const PASS = "\x1b[32m✓\x1b[0m";
const FAIL = "\x1b[31m✗\x1b[0m";
const WARN = "\x1b[33m⚠\x1b[0m";
const INFO = "\x1b[36mℹ\x1b[0m";

let failures = 0;
let warnings = 0;

function pass(label) {
  console.log(`  ${PASS}  ${label}`);
}

function fail(label, detail) {
  console.log(`  ${FAIL}  ${label}`);

  if (detail) {
    console.log(`       ${detail}`);
  }

  failures++;
}

function warn(label, detail) {
  console.log(`  ${WARN}  ${label}`);

  if (detail) {
    console.log(`       ${detail}`);
  }

  warnings++;
}

function info(label) {
  console.log(`  ${INFO}  ${label}`);
}

function section(title) {
  console.log(`\n\x1b[1m${title}\x1b[0m`);
}

const relaxedPreflight =
  process.argv.includes("--relaxed") ||
  process.env.DEMO_PREFLIGHT_RELAXED === "1" ||
  process.env.DEMO_PREFLIGHT_RELAXED === "true";

// ──────────────────────────────────────────────
// 1. Environment variables
// ──────────────────────────────────────────────
section("1. Environment flags");

const demoStaticOperator =
  process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR === "true" ||
  process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR === "1";

const demoMode =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
  process.env.NEXT_PUBLIC_DEMO_MODE === "1";

if (demoStaticOperator) {
  pass("NEXT_PUBLIC_DEMO_STATIC_OPERATOR is set — buyer-polished shell enabled");
} else if (relaxedPreflight) {
  warn(
    "NEXT_PUBLIC_DEMO_STATIC_OPERATOR is not set",
    'Expected "true" or "1" for buyer screenshots. Relaxed mode: continuing.',
  );
} else {
  fail(
    "NEXT_PUBLIC_DEMO_STATIC_OPERATOR is not set",
    'Expected "true" or "1". Buyer-polished operator shell will not activate.',
  );
}

if (demoMode) {
  pass("NEXT_PUBLIC_DEMO_MODE is set — public demo mode enabled");
} else {
  info("NEXT_PUBLIC_DEMO_MODE is not set (optional for buyer-polished builds)");
}

const authUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
const authSecret = process.env.NEXTAUTH_SECRET ?? "";

if (authSecret.length === 0) {
  warn(
    "NEXTAUTH_SECRET is not set",
    "Auth flows will fail unless this is a fully static / no-auth demo build.",
  );
} else {
  pass("NEXTAUTH_SECRET present");
}

if (authUrl.length === 0) {
  warn("NEXTAUTH_URL / NEXT_PUBLIC_APP_URL not set — absolute callback URLs may break");
} else {
  pass(`App base URL: ${authUrl}`);
}

// ──────────────────────────────────────────────
// 2. Static demo payload sanity
// ──────────────────────────────────────────────
section("2. Static demo payload sanity");

/**
 * Lightweight structural probe — avoids importing TypeScript modules by
 * checking that the compiled JSON/dist artefacts exist.  If the src check
 * passes the compiled artefact will be consistent.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcRoot = resolve(__dirname, "..", "src");

const CRITICAL_STATIC_DEMO_SOURCES = [
  "lib/showcase-static-demo.ts",
  "lib/operator-static-demo.ts",
  "lib/demo-run-canonical.ts",
  "lib/demo-audit-sample-events.ts",
  "lib/ask-static-demo-messages.ts",
];

let allSourcesPresent = true;

for (const rel of CRITICAL_STATIC_DEMO_SOURCES) {
  const full = resolve(srcRoot, rel);

  if (existsSync(full)) {
    pass(`Source present: ${rel}`);
  } else {
    fail(`Missing source file: ${rel}`);
    allSourcesPresent = false;
  }
}

if (allSourcesPresent) {
  // Quick string probes — no TypeScript execution needed
  const showcaseSrc = readFileSync(resolve(srcRoot, "lib/showcase-static-demo.ts"), "utf8");

  if (showcaseSrc.includes("claims-intake-modernization")) {
    pass('SHOWCASE_STATIC_DEMO_RUN_ID contains "claims-intake-modernization"');
  } else {
    fail("SHOWCASE_STATIC_DEMO_RUN_ID may have been renamed — verify showcase-static-demo.ts");
  }

  const canonicalSrc = readFileSync(resolve(srcRoot, "lib/demo-run-canonical.ts"), "utf8");

  if (canonicalSrc.includes("claims-intake-modernization-run")) {
    pass('"claims-intake-modernization-run" alias present in demo-run-canonical.ts');
  } else {
    fail('"claims-intake-modernization-run" alias missing — /reviews/claims-intake-modernization-run will not redirect');
  }
}

// ──────────────────────────────────────────────
// 3. Key routes exist in the app directory
// ──────────────────────────────────────────────
section("3. Key demo routes");

const REQUIRED_ROUTES = [
  // operator shell
  "app/(operator)/page.tsx",
  "app/(operator)/reviews/[runId]/page.tsx",
  "app/(operator)/reviews/[runId]/error.tsx",
  "app/(operator)/governance/findings/GovernanceFindingsQueueClient.tsx",
  "app/(operator)/alerts/page.tsx",
  "app/(operator)/audit/page.tsx",
  "app/(operator)/ask/page.tsx",
  "app/(operator)/graph/page.tsx",
  // marketing / demo
  "app/(marketing)/demo/preview/DemoPreviewMarketingBody.tsx",
];

for (const rel of REQUIRED_ROUTES) {
  const full = resolve(srcRoot, rel);

  if (existsSync(full)) {
    pass(`Route present: ${rel}`);
  } else {
    fail(`Missing route: ${rel}`);
  }
}

// ──────────────────────────────────────────────
// 4. Buyer-polished guard check
// ──────────────────────────────────────────────
section("4. Buyer-polished guard coverage");

const BUYER_GUARD_FILES = [
  "lib/demo-ui-env.ts",
  "components/HomeFirstRunWorkflowGate.tsx",
  "components/SampleFirstReviewPackageCard.tsx",
  "components/ScopeSwitcher.tsx",
  "components/SidebarNav.tsx",
];

for (const rel of BUYER_GUARD_FILES) {
  const full = resolve(srcRoot, rel);

  if (!existsSync(full)) {
    fail(`Missing file: ${rel}`);
    continue;
  }

  const src = readFileSync(full, "utf8");

  if (src.includes("isBuyerPolishedOperatorShellEnv")) {
    pass(`isBuyerPolishedOperatorShellEnv used in: ${rel}`);
  } else {
    warn(`isBuyerPolishedOperatorShellEnv not found in: ${rel}`, "May be intentional — verify manually");
  }
}

// ──────────────────────────────────────────────
// Summary
// ──────────────────────────────────────────────
console.log("\n" + "─".repeat(60));

if (failures === 0 && warnings === 0) {
  console.log(`\x1b[32m\nAll checks passed — demo environment looks ready.\x1b[0m\n`);
  process.exit(0);
} else if (failures === 0) {
  console.log(
    `\x1b[33m\nPassed with ${warnings} warning(s) — review warnings before handing off to buyer.\x1b[0m\n`,
  );
  process.exit(0);
} else {
  console.log(
    `\x1b[31m\n${failures} check(s) FAILED, ${warnings} warning(s) — fix failures before demoing.\x1b[0m\n`,
  );
  process.exit(1);
}
