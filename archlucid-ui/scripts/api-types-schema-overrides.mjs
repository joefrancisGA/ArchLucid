/**
 * openapi-typescript collapses some OpenAPI schemas to `unknown` while the UI
 * still depends on the richer shapes. Patch those entries after generation.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const masterSchemasPath = path.resolve(
  __dirname,
  "..",
  "src",
  "lib",
  "api-types",
  "schemas.generated.master-baseline.ts",
);

const NESTED_SCHEMAS_TO_RESTORE = [
  "ArchitectureFinding",
  "AgentResultRetrievalGroundingTrace",
  "AgentTopologyProposal",
];

/**
 * @param {string} schemasBody `export interface components { ... }` slice
 * @returns {string}
 */
export function applySchemaOverrides(schemasBody) {
  if (!fs.existsSync(masterSchemasPath)) {
    return schemasBody;
  }

  const masterSchemas = fs.readFileSync(masterSchemasPath, "utf8");
  const componentsMarker = "export interface components";
  const masterBody = masterSchemas.slice(masterSchemas.indexOf(componentsMarker));

  let patchedBody = schemasBody;
  const patched = new Set();

  const unknownSchemaPattern = /^\s+([A-Za-z][A-Za-z0-9_]*): unknown;/gm;
  let match = null;

  while ((match = unknownSchemaPattern.exec(schemasBody)) !== null) {
    const schemaName = match[1];
    const replacement = extractSchemaDefinition(masterBody, schemaName);

    if (!replacement) {
      continue;
    }

    const regenPattern = new RegExp(`\\n\\s+${schemaName}: unknown;`, "m");

    if (!regenPattern.test(patchedBody)) {
      continue;
    }

    patchedBody = patchedBody.replace(regenPattern, replacement);
    patched.add(schemaName);
  }

  for (const schemaName of NESTED_SCHEMAS_TO_RESTORE) {
    if (patched.has(schemaName) || patchedBody.includes(`\n        ${schemaName}:`)) {
      continue;
    }

    const replacement = extractSchemaDefinition(masterBody, schemaName);

    if (!replacement) {
      continue;
    }

    const insertBefore = findInsertAnchor(patchedBody, schemaName);
    patchedBody = patchedBody.replace(insertBefore, `${replacement}${insertBefore}`);
    patched.add(schemaName);
  }

  if (patched.size > 0) {
    console.info(`api-types-schema-overrides: patched ${[...patched].join(", ")}`);
  }

  return patchedBody;
}

/**
 * @param {string} masterBody
 * @param {string} schemaName
 * @returns {string | null}
 */
function extractSchemaDefinition(masterBody, schemaName) {
  const marker = `\n        ${schemaName}:`;
  const startIndex = masterBody.indexOf(marker);

  if (startIndex < 0) {
    return null;
  }

  const afterName = masterBody.indexOf(":", startIndex) + 1;
  const remainder = masterBody.slice(afterName);
  const trimmed = remainder.trimStart();

  if (trimmed.startsWith("{")) {
    const blockStart = afterName + (remainder.length - trimmed.length);
    const blockEnd = findMatchingBraceEnd(masterBody, blockStart);

    if (blockEnd < 0) {
      return null;
    }

    const semicolonIndex = masterBody.indexOf(";", blockEnd);

    if (semicolonIndex < 0) {
      return null;
    }

    return masterBody.slice(startIndex, semicolonIndex + 1);
  }

  const scalarEnd = masterBody.indexOf(";", afterName);

  if (scalarEnd < 0) {
    return null;
  }

  return masterBody.slice(startIndex, scalarEnd + 1);
}

/**
 * @param {string} text
 * @param {number} openBraceIndex
 * @returns {number}
 */
function findMatchingBraceEnd(text, openBraceIndex) {
  let depth = 0;

  for (let index = openBraceIndex; index < text.length; index += 1) {
    const char = text[index];

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

/**
 * @param {string} schemasBody
 * @param {string} schemaName
 * @returns {string}
 */
function findInsertAnchor(schemasBody, schemaName) {
  const schemaNames = [...schemasBody.matchAll(/\n        ([A-Za-z][A-Za-z0-9_]*):/g)].map((match) => match[1]);
  const insertBeforeName = schemaNames.find((name) => name.localeCompare(schemaName) > 0);

  if (!insertBeforeName) {
    return "\n        AgentTask:";
  }

  return `\n        ${insertBeforeName}:`;
}
