/**
 * Live API / private-beta Playwright CI skips `build:docs-pdf` (~4–5 min) because
 * JwtBearer access-path smoke does not exercise static help PDF routes. Mirror the
 * Docker build stage: ensure output dirs exist so Next standalone tracing succeeds.
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const uiRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDocsPdf = join(uiRoot, "public", "docs-pdf");
const customerDocsPdf = join(uiRoot, ".build", "docs-pdf-customer");

mkdirSync(publicDocsPdf, { recursive: true });
mkdirSync(customerDocsPdf, { recursive: true });

console.log(`Prepared live-e2e static asset dirs under ${publicDocsPdf} and ${customerDocsPdf}`);
