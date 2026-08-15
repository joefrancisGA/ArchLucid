import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { SRC_ROOT } from "@/lib/testing/repo-paths";

/**
 * Concatenated source of every claim-then-sources strip family module.
 *
 * Copy-wiring tests assert that a surface's copy module is referenced by the strip registry. They
 * used to read one monolithic registry file, so they broke the moment a strip moved into a family
 * module. Reading the whole family keeps the assertion about wiring rather than about which file
 * happens to hold the definition.
 */

const REGISTRY_DIRECTORY = join(SRC_ROOT, "components", "evidence-orientation", "registry");

/** Family modules only — the barrel re-exports them and carries no strip definitions. */
const FAMILY_MODULE_PATTERN = /^claim-and-sources-.+-strips\.tsx$/;

export function readClaimAndSourcesRegistrySource(): string {
  const modules = readdirSync(REGISTRY_DIRECTORY).filter((name) =>
    FAMILY_MODULE_PATTERN.test(name),
  );

  if (modules.length === 0) {
    throw new Error(`No claim-and-sources family modules found in ${REGISTRY_DIRECTORY}`);
  }

  return modules.map((name) => readFileSync(join(REGISTRY_DIRECTORY, name), "utf8")).join("\n");
}
