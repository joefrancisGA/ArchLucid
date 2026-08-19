/**
 * Resolves a Python 3 binary on the PATH. `python3` is common on macOS/Linux;
 * on Windows, `py -3` or `python` is often the only option.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(scriptDir, "..");
const pricingScript = path.join(projectRoot, "..", "scripts", "ci", "generate_pricing_json.py");

const candidates = [
  { cmd: "python3", args: [pricingScript] },
  { cmd: "py", args: ["-3", pricingScript] },
  { cmd: "python", args: [pricingScript] },
];

for (const { cmd, args } of candidates) {
  try {
    execFileSync(cmd, args, { stdio: "inherit", cwd: projectRoot });
    process.exit(0);
  } catch {
    // try next candidate
  }
}

console.error(
  "generate_pricing: no working Python 3 on PATH. Tried: python3, py -3, python. " +
    "Install Python 3 or add it to PATH, then re-run the build."
);
process.exit(1);
