# Fix: CodeQL #3887 follow-on — alert #765 file-system race (TOCTOU)

> Parent: [`fix-codeql-run-3887-00-index.md`](fix-codeql-run-3887-00-index.md)
> Alert: https://github.com/joefrancisGA/ArchLucid/security/code-scanning/765
> Rule: `js/file-system-race`
> Path: `archlucid-ui/src/lib/report-problem-surfaces-guard.ts:120`
>
> **Note:** Open on `master`; JS SARIF gate did not run on 3887 because the UI build failed. Fix with the JS batch.

## Symptom

```ts
export function readSurfaceSourceBundle(uiRoot: string, relativePath: string): string {
  const absolutePath = join(uiRoot, "src", relativePath);

  if (!existsSync(absolutePath)) {
    return "";
  }

  const stat = statSync(absolutePath);

  if (stat.isFile()) {
    return readFileSync(absolutePath, "utf8"); // <-- alert anchors near here
  }

  return collectTsxSourceFiles(absolutePath)
    .map((filePath) => readFileSync(filePath, "utf8"))
    .join("\n");
}
```

CodeQL: check (`existsSync` / `statSync`) and use (`readFileSync`) are separate; file may change between them (CWE-367).

## Assessment

| Aspect | Detail |
|--------|--------|
| Severity | High (query tagging) |
| Runtime context | **Dev/CI guard** over the local UI source tree (report-problem surface registry), not a multi-tenant upload path. |
| Practical risk | Low on CI runners / developer machines. Still merge-blocking once JS SARIF runs. |
| Fix goal | Eliminate TOCTOU pattern CodeQL recognizes, without changing guard semantics. |

## Required fix

Prefer **open/read and handle errors** over exists-then-read:

1. For the file branch, attempt `readFileSync` (or `fs.promises` equivalent if the file is async-ified) inside `try/catch`:

   - `ENOENT` → return `""` (same as today’s missing path).
   - If the path is a directory, `readFileSync` fails — fall through to directory collection (or `stat` **after** a failed file read only if needed).

2. Avoid `existsSync` before `readFileSync` on the same path. If you still need to distinguish file vs directory:

   - `try { return readFileSync(...) } catch { /* not a readable file */ }`
   - then `try { return collectTsxSourceFiles(...).map(readFileSync)... } catch { return "" }`
   - or use `opendir` / `readdir` and treat failure as empty.

3. Keep `registryComponentPathExists` behavior stable for callers; if it also uses exists-then-operate in a way CodeQL flags, apply the same pattern there only if alerted.

4. Add/adjust a unit test for missing path → `""` and for a real fixture file → non-empty source (existing guard tests if any).

## Alternatives considered

| Alternative | Trade-off |
|-------------|-----------|
| Suppress with `// codeql[js/file-system-race]` | Acceptable only if refactor is awkward; prefer try/read. |
| Use file descriptors (`open` + `read`) | More correct vs TOCTOU, heavier for a sync CI helper — optional if try/read is insufficient for CodeQL. |

## Acceptance

1. Alert #765 cleared on next JS CodeQL SARIF.
2. Guard behavior unchanged for missing / file / directory surface paths.
3. Related Vitest guard tests pass.
