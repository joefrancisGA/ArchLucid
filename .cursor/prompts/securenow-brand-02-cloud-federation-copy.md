# SN-02 — Cloud connection and federation consumer copy

**Do not** globally replace `ArchLucid`. **Do not** rename Entra tenant GUIDs, managed-identity object IDs, IAM role ARNs, or trust-policy JSON keys. **Do not** change Architecture-only wizard copy. **Do not** start SN-04 help-pipeline work beyond the secure-connect **copy modules** named here.

Depends on **SN-01** (`product-line-display-name.ts`). If that helper is missing, stop and run SN-01 first.

## Goal

In the Security shell, consumer-facing cloud-connection copy talks about **SecureNow** as the product that stores metadata and federates — not ArchLucid — while technical placeholders remain accurate.

Labels such as “ArchLucid tenant ID” become **“SecureNow tenant ID”** (or “SecureNow federation tenant ID”) **in the UI**. The value is still the platform Entra tenant ID. Do not change the GUID or the `{…}` replacement keys in scripts unless you add a **compat alias** (old key still interpolates).

## Why

Cloud setup is the densest Security-spine copy. Federation screens currently say “ArchLucid federation identifiers”, “ArchLucid stores connection metadata only”, and AWS trust-policy templates `{ArchLucid tenant ID}`. Consumers doing IAM work will keep seeing the old brand after chrome is renamed.

## Context

Use the display-name helper from SN-01. Touch copy modules, not JSX literals when a module already exists.

- `archlucid-ui/src/lib/cloud-security-preflight-topics.ts`
- `archlucid-ui/src/lib/cloud-connections-copy.ts`
- `archlucid-ui/src/lib/azure-cloud-connection-copy.ts`
- `archlucid-ui/src/lib/aws-cloud-connection-trust-policy-starter.ts` (+ tests)
- `archlucid-ui/src/lib/gcp-cloud-connection-permissions-manifest.ts`
- `archlucid-ui/src/lib/connect-azure-securely-help-content.ts`
- `archlucid-ui/src/lib/connect-aws-securely-help-content.ts`
- `archlucid-ui/src/lib/connect-gcp-securely-help-content.ts`
- `archlucid-ui/src/app/(operator)/integrations/cloud-connections/_sections/tier2-connection-wizard-content.ts`
- `archlucid-ui/src/app/(operator)/integrations/cloud-connections/_sections/Tier2ConnectionSecurityStep.tsx` — heading “ArchLucid federation identifiers”
- `archlucid-ui/src/app/(operator)/integrations/cloud-connections/_sections/aws-connection-wizard-content.ts`
- `archlucid-ui/src/app/(operator)/integrations/cloud-connections/_sections/gcp-connection-wizard-content.ts`
- `archlucid-ui/src/app/(operator)/help/_sections/HelpConnectAzureSecurelyGuideView.tsx` / `HelpConnectAwsSecurelyGuideView.tsx` / `HelpAzurePermissionsSetupSection.tsx` — only strings that name the product; do not rewrite unrelated help topics (SN-04)

Placeholder policy:

- Prefer interpolating `productLineDisplayName("security")` in TS copy.
- If a script template must keep a stable `{ArchLucid tenant ID}` token for already-copied runbooks, keep the token **and** show a UI label “SecureNow tenant ID”. Document that in a one-line comment. Do not silently break existing customer scripts.

## What to build

1. Replace consumer sentences that name ArchLucid as the *product* (stores metadata, connector identity, “return to … and verify”, “trusts … federated identity”).
2. Relabel identifier fields: tenant ID, managed identity object ID, federation card title.
3. AWS placeholder `arn:aws:iam::…:role/ArchLucidReadOnly` in **examples** may become `SecureNowReadOnly` **only as placeholder text**. Do not migrate live role names.
4. Vitest: preflight topics, wizard content, trust-policy starter, secure-connect help content, Tier2 heading. Update snapshots.

## Acceptance criteria

- Security-shell cloud preflight and Azure/AWS/GCP connection wizards do not tell the consumer the product is named ArchLucid.
- Architecture product line still uses ArchLucid in the same modules (branch on `resolveProductLineId()` / pass `productLine` into copy builders — do not hardcode SecureNow into architecture env).
- Federation **values** unchanged. Script interpolation still works for existing `{ArchLucid …}` keys if you kept them.
- No `security@archlucid.net` or `X-ArchLucid-*` changes.

## Constraints

- Sentence case. Carbon density. Stage only cloud-connection + named help-content files + tests.
- Scoped Vitest. No full UI suite. No `dotnet` in this prompt.
