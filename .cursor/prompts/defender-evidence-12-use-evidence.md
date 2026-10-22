# DFV-12 — Use the collected Defender evidence

**Model:** Composer 2.5. Paste this file as the whole task. Do not add another Defender API.

**Repo:** `c:\ArchLucid`

## Goal

Use the Defender rows the earlier prompts stored. Do not call Microsoft Defender again in this session.

## Why

Collected rows that never change a rank, an explanation, or an evidence selection are still unused. The `defender` evidence type is currently hardcoded as unsupported next to Entra.

## Read first

- `ArchLucid.Core/InfraEvidence/AuditEvidenceTypeNames.cs`
- `ArchLucid.Application/InfraEvidence/AuditEvidence/IdentityAuditEvidenceSelector.cs`
- `ArchLucid.Application/InfraEvidence/AuditEvidence/AuditEvidenceSelectorRegistry.cs`
- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/PathRankingEngine.cs`
- `DefenderSecureScoreRankAdjustment`
- `DefenderBandContextResolver`
- `SqlAzureInventorySnapshotRepository.PerfReadSlices.cs` (`TryGetDefenderBandContextAsync`)

If a table from DFV-03, DFV-06, DFV-07, or DFV-08 is not in the repo yet, stop and say which prompt has not landed. Do not invent empty stand-in tables.

## What to build

### Evidence type `defender`

Remove `defender` from `AuditEvidenceTypeNames.EntraSpecificTypes`.

Add `DefenderAuditEvidenceSelector` in its own file. Register it in `AuditEvidenceSelectorRegistry` the same way the other selectors are registered. It produces evidence type `defender`.

Selection rules, using only rows on the snapshot:

- Unhealthy assessment rows become candidates. `AzureResourceId` is the assessment resource id. `Summary` includes the assessment display name and severity.
- When no unhealthy assessment rows exist and a secure-score summary or score-control row exists, return one candidate on the subscription resource id whose summary includes the score or the control name.
- When none of those rows exist, return Insufficient with `Defender for Cloud evidence was not in this snapshot.`
- Do not return Unsupported for `defender`.

The Entra unsupported sentence in `IdentityAuditEvidenceSelector` must no longer mention Defender. Entra, PIM, and Conditional Access stay unsupported.

### Path rank

Extend the defender context loaded by `TryGetDefenderBandContextAsync` so ranking can see unhealthy assessments, active alerts, attack-path summaries, vulnerability counts, and governance due dates for that snapshot without loading the full snapshot.

For each path, start from the existing subscription-band blast-radius adjustment. Then raise that path's adjustment to the highest matching hop signal. Do not add the signals together.

| Hop signal | Adjustment |
|------------|------------|
| Active or in-progress alert with severity High, or unhealthy assessment with severity High | 0.75 |
| Unhealthy assessment with severity Medium, and no high signal on that path | 0.50 |
| Otherwise | the existing subscription-band adjustment |

`Critical` alerts were stored as High by DFV-06. Match resource ids on path hops to assessment `resourceId` and alert `resourceId`.

Explanation source:

- `defender-assessment-high` or `defender-alert-high` when the 0.75 row applies
- `defender-assessment-medium` when the 0.50 row applies and the subscription band was not already higher
- Keep the existing `defender-posture-low` and `defender-posture-medium` labels when the subscription band is what set the adjustment

When a hop resource id is an entry or target id on a stored attack-path row, append the attack path id and risk level to `ExplanationSummary`. Do not change the numeric score for that citation. Do not create a `SecurityEvidencePath` from the attack-path row.

When a hop resource has `criticalCount + highCount` greater than 0, append `N critical or high vulnerability findings` using that sum. Do not list CVE ids. Do not change the numeric score for that clause.

When a hop's unhealthy assessment has a governance `remediationDueUtc` on or before 30 days from `utcNow`, append the assessment key and the due date. Do not invent an owner. Do not change the numeric score for that clause.

When the subscription band is Low or Medium and score-control rows exist, append the three control names with the largest `max - current` where `max` is greater than 0. Do not change the numeric score for that clause.

Leave `DefenderSecureScoreOrdinalBandMapper` thresholds unchanged.

## Tests

- Evidence type `defender` with one unhealthy assessment returns Collected and that resource id.
- Evidence type `defender` with only a secure-score summary returns Collected on the subscription id.
- Evidence type `defender` with no Defender rows returns Insufficient, not Unsupported.
- Evidence type `entra` still returns Unsupported, and the message does not contain `Defender`.
- A path whose hop has an unhealthy High assessment gets blast-radius adjustment 0.75 even when the subscription band is High.
- A path with a medium assessment and a low subscription band gets 0.50, not 0.50 plus 0.25.
- A path that shares a target resource with an attack-path row keeps its numeric score and includes that attack path id in the explanation.
- A hop with `criticalCount` 2 includes `2 critical or high vulnerability findings` and does not include a CVE id.
- Registry construction includes the new selector.

## Constraints

- Do not add an ARM, Graph, or Defender HTTP call.
- Do not add graph nodes for assessments, alerts, attack paths, or CVEs.
- Do not change the `defender-summary.json` row shape.
- One class per file. No `ConfigureAwait(false)` in tests.
- Before each tracked edit, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- One compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`.
- Run the path-ranking tests and the audit-evidence selector tests you changed.
- Do not commit.

## Done when

A `defender` evidence requirement uses stored assessment or score rows, a high assessment or alert on a hop outranks the subscription-wide band, and attack-path, vulnerability, and due-date facts show up in the explanation without creating new paths.
