import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

/** One module that reads from the network inside a `useEffect` body. */
export type EffectReadSite = {
  readonly path: string;
  /** Names of the network calls found, sorted, for readable guard failures. */
  readonly reads: readonly string[];
};

const SRC_ROOT = join(process.cwd(), "src");

/**
 * Effects that open a stream or start a poll loop are not query candidates: TanStack Query owns
 * request/response reads, not subscription lifecycles.
 */
const STREAMING_TOKENS = ["EventSource", "setInterval(", "addEventListener(", "WebSocket"] as const;

/** Module specifiers whose exports issue HTTP calls. */
const NETWORK_MODULE = /(\/api\/|\/api$|-api$|-api-client$|-client$|api-client)/;

/** Specifiers that match {@link NETWORK_MODULE} by name but hold no HTTP calls. */
const NOT_NETWORK_MODULE = /(query-client|query-keys|-test-|testing\/)/;

const IMPORT_BLOCK = /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*["']([^"']+)["']/g;

/** `foo(` but not `bar.foo(`, so `storage.getItem(...)` is not mistaken for a network read. */
const BARE_CALL = /(?<![.\w])([a-zA-Z_]\w*)\s*\(/g;

/** How many local helper functions deep a call chain is followed before the scan gives up. */
const MAX_LOCAL_HOPS = 2;

function isScannableFile(name: string): boolean {
  if (name.endsWith(".d.ts") || name.includes(".test.")) {
    return false;
  }

  return name.endsWith(".ts") || name.endsWith(".tsx");
}

function collectScannableFiles(directory: string): readonly string[] {
  const files: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectScannableFiles(fullPath));
      continue;
    }

    if (entry.isFile() && isScannableFile(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

/** Identifiers this module imported from a network module, so bare calls to them count as reads. */
function networkBindings(source: string): ReadonlySet<string> {
  const bindings = new Set<string>();

  for (const [, names, module] of source.matchAll(IMPORT_BLOCK)) {
    if (NOT_NETWORK_MODULE.test(module) || !NETWORK_MODULE.test(module)) {
      continue;
    }

    for (const raw of names.split(",")) {
      // `getRun as fetchRun` binds the local alias, which is the name that appears at call sites.
      const parts = raw.trim().split(" as ");
      const name = parts[parts.length - 1].trim();

      if (name.length > 0 && !name.startsWith("type ")) {
        bindings.add(name);
      }
    }
  }

  return bindings;
}

/**
 * Text from `openIndex` through the matching closer, so a nested `)` or `}` does not end the slice
 * early. Regex alone cannot match balanced delimiters.
 */
function balancedSlice(source: string, openIndex: number, opener: string, closer: string): string {
  let depth = 0;

  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];

    if (char === opener) {
      depth += 1;
    } else if (char === closer) {
      depth -= 1;

      if (depth === 0) {
        return source.slice(openIndex, index + 1);
      }
    }
  }

  return source.slice(openIndex);
}

function effectBodies(source: string): readonly string[] {
  const bodies: string[] = [];

  for (const match of source.matchAll(/\buseEffect\s*\(/g)) {
    const openIndex = (match.index ?? 0) + match[0].length - 1;

    bodies.push(balancedSlice(source, openIndex, "(", ")"));
  }

  return bodies;
}

/** Bodies of functions declared in this module, so an effect calling a local loader resolves. */
function localFunctionBodies(source: string): ReadonlyMap<string, string> {
  const bodies = new Map<string, string>();
  const declarations = [
    /(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*(?::[^{]*)?\{/g,
    /const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*(?::[^=]*)?=>\s*\{/g,
  ];

  for (const pattern of declarations) {
    for (const match of source.matchAll(pattern)) {
      const openIndex = (match.index ?? 0) + match[0].length - 1;

      bodies.set(match[1], balancedSlice(source, openIndex, "{", "}"));
    }
  }

  return bodies;
}

function readsInBody(
  body: string,
  bindings: ReadonlySet<string>,
  localBodies: ReadonlyMap<string, string>,
  hopsLeft: number,
): ReadonlySet<string> {
  const reads = new Set<string>();

  for (const [, name] of body.matchAll(BARE_CALL)) {
    if (name === "fetch" || bindings.has(name)) {
      reads.add(name);
      continue;
    }

    const localBody = hopsLeft > 0 ? localBodies.get(name) : undefined;

    if (localBody !== undefined) {
      for (const nested of readsInBody(localBody, bindings, localBodies, hopsLeft - 1)) {
        reads.add(nested);
      }
    }
  }

  return reads;
}

/**
 * Network calls this module performs inside `useEffect`, sorted.
 *
 * Known imprecision: a synchronous helper exported from an `-api` module is reported, because
 * without type information the scan cannot tell it apart from a request. Such sites belong in the
 * non-query list of the guard rather than in the migration backlog.
 */
export function findEffectReadsInSource(source: string | null | undefined): readonly string[] {
  if (source === null || source === undefined || !source.includes("useEffect")) {
    return [];
  }

  const bindings = networkBindings(source);
  const localBodies = localFunctionBodies(source);
  const reads = new Set<string>();

  for (const body of effectBodies(source)) {
    if (STREAMING_TOKENS.some((token) => body.includes(token))) {
      continue;
    }

    for (const read of readsInBody(body, bindings, localBodies, MAX_LOCAL_HOPS)) {
      reads.add(read);
    }
  }

  return [...reads].sort();
}

/** Every module under `src/` that reads from the network inside `useEffect`, sorted by path. */
export function findEffectReadSites(): readonly EffectReadSite[] {
  const sites: EffectReadSite[] = [];

  for (const fullPath of collectScannableFiles(SRC_ROOT)) {
    const reads = findEffectReadsInSource(readFileSync(fullPath, "utf8"));

    if (reads.length === 0) {
      continue;
    }

    sites.push({
      path: relative(process.cwd(), fullPath).split(sep).join("/"),
      reads,
    });
  }

  return sites.sort((left, right) => left.path.localeCompare(right.path));
}
