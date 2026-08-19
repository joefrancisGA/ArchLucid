# Fix: CodeQL #3887 / alert #766 — `cs/user-controlled-bypass` on terms attestation

> Parent: [`fix-codeql-run-3887-00-index.md`](fix-codeql-run-3887-00-index.md)
> Alert: https://github.com/joefrancisGA/ArchLucid/security/code-scanning/766
> Run: `29590827329` · commit `312731f10e9bbd931bd99e75414eec8aaf3f27fd`

## Symptom

C# SARIF gate:

```text
Unresolved cs/user-controlled-bypass at ArchLucid.Application/Identity/PostAuthBootstrapService.cs:237
```

On that commit, line 237 is:

```csharp
if (!request.TermsAccepted) // codeql[cs/user-controlled-bypass]: server-side attestation gate; denies workspace creation when false.
```

CodeQL columns 14–35 map to `request.TermsAccepted`. Message: *This condition guards a sensitive action, but a user-provided value controls it.*

**Important:** the trailing `// codeql[cs/user-controlled-bypass]` comment is already present on `master` and **did not** clear `assert_codeql_sarif_clean.py`. Do not “fix” this by only rewording the comment unless you verify the SARIF `suppressions` array is populated. Prefer a structural fix.

## Assessment

| Aspect | Detail |
|--------|--------|
| Severity | High (CWE-807 family) |
| True positive? | **No — product-correct attestation.** User must set `TermsAccepted=true` to create a workspace; `false` **denies**. This is not cookie/auth bypass. |
| Why CodeQL fires | User-controlled boolean decides whether the sensitive `CreateWorkspaceAsync` path continues past the early deny. |
| Why comment failed | Inline alert comment did not produce a SARIF suppression that the gate skips (or was ignored for this query). Gate only skips results with a non-empty `suppressions` array. |

## Required fix (preferred)

Extract a **server-owned attestation gate** so `CreateWorkspaceAsync` does not branch on a raw request bool next to provisioning:

1. Add a small type in Application or Core, e.g. `PostAuthTermsAttestation` / `IPostAuthTermsAttestationGate`, with one method:

   ```csharp
   // Returns deny result when attestation is missing; otherwise null.
   PostAuthCreateWorkspaceResult? DenyIfTermsNotAccepted(bool termsAccepted);
   ```

2. Implement **fail-closed**: only when `termsAccepted` is exactly `true` return `null`; otherwise return the existing deny message (`"Accept the terms to create a workspace."`).

3. Call it at the top of `CreateWorkspaceAsync` **before** abuse policy / provisioning:

   ```csharp
   PostAuthCreateWorkspaceResult? termsDenial = _termsAttestation.DenyIfTermsNotAccepted(request.TermsAccepted);
   if (termsDenial is not null)
   {
       return termsDenial;
   }
   ```

4. Put any unavoidable `// codeql[cs/user-controlled-bypass]` on the **single condition inside the gate class** (preferably on the **line above** the `if`, not a trailing comment), with a short rationale. Document in `docs/library/CODEQL_TRIAGE.md` under a short “Terms attestation” bullet if a suppression remains.

5. Keep behavior identical: no change to API contract, copy, or audit events.

### Alternatives considered (reject unless preferred fails)

| Alternative | Why secondary |
|-------------|----------------|
| GitHub UI dismiss only | Does **not** satisfy SARIF gate. |
| Trailing comment only (status quo) | Already failed on run 3887. |
| Remove terms check | Security/product regression — not allowed. |

## Tests

Extend `ArchLucid.Application.Tests/Identity/PostAuthBootstrapServiceTests.cs` (or dedicated gate tests):

- `TermsAccepted=false` → deny, no tenant provisioning side effects.
- `TermsAccepted=true` with other happy-path mocks → proceeds past the gate (existing create-workspace tests still pass).

Do **not** use `ConfigureAwait(false)` in tests.

## Acceptance

1. Alert #766 absent from new C# SARIF (or present only with SARIF `suppressions`).
2. `python scripts/ci/assert_codeql_sarif_clean.py <csharp-sarif-dir>` exits 0 for a local/CI CodeQL csharp run.
3. Existing post-auth bootstrap unit tests green; new terms-false coverage added.
4. No behavior change for invited/SSO/abuse denial paths.
