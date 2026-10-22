# Fix: CodeQL #3887 follow-on — alerts #763 / #764 incomplete URL substring checks

> Parent: [`fix-codeql-run-3887-00-index.md`](fix-codeql-run-3887-00-index.md)
> Alerts:
> - https://github.com/joefrancisGA/ArchLucid/security/code-scanning/763 (`login.microsoftonline.com`)
> - https://github.com/joefrancisGA/ArchLucid/security/code-scanning/764 (`accounts.google.com`)
> Rule: `js/incomplete-url-substring-sanitization`
>
> **Note:** These did not fail run 3887’s JS SARIF step (build failed first). Fix them in the same batch so the next green build does not immediately fail the SARIF gate.

## Symptom

`archlucid-ui/src/lib/auth/sign-in-method-options.ts`:

```ts
if (authority.includes("login.microsoftonline.com")) { ... }
if (googleAuthority.includes("accounts.google.com")) { ... }
```

CodeQL: host substring can appear anywhere in the string; arbitrary hosts may come before/after.

## Assessment

| Aspect | Detail |
|--------|--------|
| Severity | High (query tagging) |
| Data source | Server/build-time env (`getOidcAuthority()`, `NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY`) — not an open redirect of user input. |
| Risk if wrong | Advertising Microsoft/Google supplemental buttons when authority is a lookalike string. Low exploitability vs true open-redirect, but the query is merge-blocking once SARIF runs. |
| True fix | Parse as URL and match **hostname** exactly (or suffix rules that cannot be bypassed). |

## Required fix

1. Add a tiny helper (same file or `src/lib/auth/oidc-authority-host.ts`) e.g. `authorityHostnameMatches(authority: string, allowedHosts: readonly string[]): boolean`:

   - Trim input; if empty → `false`.
   - Parse with `new URL(authority)` — if the value has no scheme, try `new URL(`https://${authority}`)` so bare issuer hosts still work.
   - On parse failure → `false`.
   - Compare `url.hostname.toLowerCase()` with **exact** equality against an allow-list (not `includes` on the full string).
   - For Microsoft, allow the known issuer hosts you actually support (at minimum `login.microsoftonline.com`; add `login.microsoft.com` only if product already supports it — do not invent hosts).
   - For Google, allow `accounts.google.com` (and only other hosts already documented in OIDC config).

2. Replace both `.includes(...)` checks with the helper.

3. Add Vitest coverage in `sign-in-method-options` tests (create if missing):

   - Exact Microsoft / Google issuer URLs → provider enabled (when other flags allow).
   - Bypass shapes must **not** match: `https://evil.example/login.microsoftonline.com`, `https://login.microsoftonline.com.evil.example`, `https://evil.com/?x=accounts.google.com`.

## Alternatives considered

| Alternative | Why not |
|-------------|---------|
| `// codeql[...]` suppression | Unnecessary; hostname parse is the correct check. |
| Keep `includes` on hostname only | Still vulnerable to `evil-login.microsoftonline.com` suffix tricks unless equality/suffix is done carefully — prefer exact allow-list. |

## Acceptance

1. Alerts #763 and #764 clear on next JS CodeQL SARIF.
2. Unit tests cover allow and bypass URL shapes.
3. No change to when supplemental providers are advertised beyond making host matching strict.
