# SN-COMP-03 — One control lineage as markdown

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-COMP prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_COMPLIANCE_COMPOSER_PROMPTS.md`

## Goal

From the Audit evidence control page, download a markdown file for the lineage already on screen. The file names the control, the snapshot, verification state, and any human-recorded association. It does not score compliance.

## Why

Compliance Readiness stays low while a reviewer can see lineage in the UI and still cannot hand an auditor one file. The lineage record already carries the fields. A new API, a second evidence store, or a numeric score would invent a compliance product the handoff note forbids.

## Read first

- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/AuditEvidenceLineageRecord.cs`
- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/AuditEvidenceLineageVerifiedRemediationAssociation.cs`
- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/AuditEvidenceLineageLatestRemediationAttempt.cs`
- `archlucid-ui/src/lib/audit-evidence-lineage-types.ts`
- `archlucid-ui/src/app/(operator)/governance/audit-evidence/[assessmentId]/snapshots/[snapshotId]/controls/[controlId]/AuditEvidenceControlLineageClient.tsx`
- `docs/securenow/CONTROL_EVIDENCE_RESPONSIBILITY.md` (disposition row only)
- `docs/securenow/ENGINEER_ANALYST_HANDOFF.md` (what not to build)

## What to build

1. Branch `sn-comp/03-lineage-export` from current `master` after SN-COMP-01 and SN-COMP-02 are present.
2. Add a pure formatter, for example `archlucid-ui/src/lib/audit-evidence-control-lineage-markdown.ts`, that accepts the lineage record the page already loaded and returns markdown text.
3. The markdown starts with a Scope line: control evidence excerpt. Not a certification. Not an ATO.
4. Include these labels when the record has them: control number, control title, assessment id, snapshot id, `chainComplete`, `snapshotHashVerified`, `readyForPositiveCheckbox`, each broken-link reason, each verified remediation association’s identifiers, and the latest remediation attempt’s id and status when that object is present.
5. The status line is **NOT VERIFIED** when `chainComplete` is false, or `readyForPositiveCheckbox` is false, or there are zero verified remediation associations. When all three are satisfied, the status line is `Ready for human disposition`. Do not print **Verified** as a compliance outcome.
6. Do not print a numeric score, a percent, or the words `SOC 2 certified`.
7. On `AuditEvidenceControlLineageClient`, add a button labeled `Download control evidence` that saves that markdown in the browser. Suggested file name: `control-evidence-` plus the control number, with characters other than letters, digits, and hyphen replaced by a hyphen. Do not call a new endpoint. If the lineage is still loading or failed, do not render the button.
8. Add a unit test for the formatter: one record that must emit **NOT VERIFIED**, and one record that must emit `Ready for human disposition` and must not emit **Verified**.

## Tests

```bash
cd archlucid-ui && npm exec vitest run src/lib/audit-evidence-control-lineage-markdown.test.ts
```

Adjust the test path if you named the file differently. Run the existing lineage client test file if you changed the client.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not add an API route, a SQL table, or a compliance score field.
- Do not let the model write a disposition.
- Do not edit `EXECUTIVE_PROOF_PACKET_TEMPLATE.md`.
- Do not hide a workspace tab behind a More menu.
- Do not commit.

## Done when

A loaded control lineage can be downloaded as markdown, incomplete lineage says **NOT VERIFIED**, and no new endpoint exists.
