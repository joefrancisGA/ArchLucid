# SN-04 — Help hub and markdown: product-line-aware ArchLucid → SecureNow

**Do not** globally replace `ArchLucid` in `docs/` or help sources. **Do not** change Architecture-process help to SecureNow. **Do not** weaken contributor-leakage rules that hide CLI/GitHub. **Do not** treat this as a company rename (`security@archlucid.net` stays).

Depends on **SN-01**. If the display-name helper is missing, stop.

## Goal

When the Security product line is active, **consumer-visible help** uses **SecureNow** instead of ArchLucid for *product* mentions. Architecture help is unchanged. Help tests that currently **require** the token `ArchLucid` in every topic must become product-line-aware.

Internal/engineering leakage stripping stays. You are replacing the **product brand token**, not re-introducing `ArchLucid.Api` / `archlucid doctor` into buyer help.

## Why

`OperatorHelpProductTextPolicy.RequiredProductNameToken = "ArchLucid"` and `help-markdown/markdown-cleanup.ts` rewrite “V1” → “ArchLucid”. Leakage tests and getting-started (“How ArchLucid works”, “Using ArchLucid”) will keep the old brand in the surface Security users actually read.

## Context

- `ArchLucid.Application/InfraEvidence/Branding/OperatorHelpProductTextPolicy.cs` — required token; update tests so Security samples may say SecureNow **or** the policy is UI-only (prefer: policy accepts the **active product display name**, not a single literal)
- `archlucid-ui/src/lib/help-markdown/markdown-cleanup.ts`
- `archlucid-ui/src/lib/help-markdown/contributor-leakage/*`
- `archlucid-ui/src/lib/help/__tests__/help-markdown-presentation.leakage-*.test.tsx`
- `archlucid-ui/src/app/(operator)/help/HelpPageView.tsx` / `HelpProductGuide.tsx` — “How ArchLucid works”, “Using ArchLucid”
- `archlucid-ui/src/lib/getting-started-help-guide-content.ts`
- `archlucid-ui/src/lib/security-trust-evidence-copy.ts` and other `*-evidence-copy.ts` links labeled “How ArchLucid works”
- `archlucid-ui/src/components/help/SecurityTrustHelpNextSteps.tsx` — mailto may stay `security@archlucid.net`
- Help topic tests: `HelpTopicGettingStarted.test.tsx`, `HelpTopicDataHandling.test.tsx`, `HelpTopicSecurityTrust.test.tsx`, `HelpTopicSubprocessors.test.tsx` (hosted ArchLucid SaaS — **company**; see rule below)

**Product vs company in help:**

| Mention | Security help |
|---------|----------------|
| The app / workspace / connector / “how it works” | SecureNow |
| Hosted SaaS legal entity, subprocessors “ArchLucid uses the following subprocessors”, order-form company | **ArchLucid** (company). Optional clarifier: “SecureNow is the Security product from ArchLucid.” |
| `security@archlucid.net` | Unchanged |

Do **not** duplicate the entire help tree. Prefer a rewrite pass: after existing leakage cleanup, replace whole-word `ArchLucid` with the display name **except** an allowlist (emails, `archlucid.net`, subprocessors/legal phrases, `ArchLucidAuth`, code fences you already strip).

## What to build

1. Pass product line (or display name) into `prepare-help-markdown` / presentation so Security sessions rewrite product mentions.
2. Update `OperatorHelpProductTextPolicy` tests: Architecture markdown still must retain `ArchLucid`; Security sample markdown retains `SecureNow` (and may still mention ArchLucid as company once).
3. Help hub headings/links: “How SecureNow works” / “Using SecureNow” when product line is security. Keep slugs/anchors (`how-archlucid-works`) unless you add a redirect alias — **prefer keep slug, change visible label only** so bookmarks survive.
4. Evidence-copy `label: "How ArchLucid works"` becomes display-name-aware.
5. Update leakage and topic tests for **both** product lines. Do not drop leakage coverage.

## Acceptance criteria

- Security process `/help` hub and getting-started visible titles use SecureNow.
- Architecture process help still says ArchLucid.
- Leakage tests still fail if CLI/GitHub/`ArchLucid.Api` buyer leakage returns.
- Subprocessors/legal company name ArchLucid remains where it is the contracting entity.
- No `docs/go-to-market` wholesale rewrite.

## Constraints

- One concern per file. Do not rename help URL slugs in this prompt unless you also add aliases.
- Scoped Vitest for help markdown + hub. If you touch the C# policy class: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'` plus filtered tests for `OperatorHelpProductTextPolicy`.
- Stage help pipeline + tests + policy if changed.
