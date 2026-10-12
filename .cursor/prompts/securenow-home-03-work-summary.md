# SN-HOME-03 — Work summary on SecureNow Home

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-HOME prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_HOME_WORK_SUMMARY_LUNA_PROMPTS.md`

**Depends on:** SN-HOME-02 for placement. If that line is absent, this section is the first block in the primary content.

## Goal

SecureNow Home opens with four actionable counts: findings assigned to the person, critical exposure, changes since the previous collection, and remediation waiting for a check. The grouped directory stays underneath.

## Why

The page is a directory. Every destination has the same visual weight, so the person has to read the whole list to decide what to do. The sidebar already repeats that directory. Home should answer what needs attention now.

## Read first

- `archlucid-ui/src/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient.tsx`
- `archlucid-ui/src/hooks/use-assigned-to-me-findings-count-query.ts`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-remediation-api.ts` (`fetchRemediationFactorySummary`, `FACTORY_SUMMARY_PATH`)
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-remediation-types.ts` (`RemediationFactoryWorkbenchSummary`)
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-remediation-stages.ts` (`canVerifyRemediationInstance`)
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-drift-api.ts` (`fetchInfraEvidenceSnapshots`, `fetchInfraEvidenceDiffsForSnapshot`)
- `archlucid-ui/src/lib/product-line/securenow-nav-labels.ts`
- `archlucid-ui/src/lib/design-tokens.ts` (`OPERATOR_TYPOGRAPHY`)
- `.cursor/prompts/securenow-menu-04-home-follows-menu.md` (posture strip — do not build it)

## What to build

1. Branch `sn-home/03-work-summary` from current `master`.
2. On SecureNow Home only, render a section titled "Your work" after the environment line from SN-HOME-02 when that line exists, and before the grouped directory.
3. Four rows. Each row is a link (`Link` / `<a>`), not a `Button`, because it navigates. One compact list. Not cards, not `kpiValue` tiles, not a second copy of the directory.

| Row | Visible label | Count | Href |
|-----|---------------|-------|------|
| Assigned | `My findings` from `SECURENOW_NAV_LABELS` | `useAssignedToMeFindingsCountQuery` | `/security/assigned-to-me` |
| Priority | `Highest-priority findings` | `criticalExposureCount` on the factory summary | `/security/remediation-factory` |
| Changes | `Recent changes` | `totalChanges` on the newest diff for the newest snapshot | `/infrastructure/snapshots-drift` |
| Verification | `Awaiting verification` | `openInstancesByStatus["ChangeImplemented"]` | `/security/remediation-instances` |

4. `fetchRemediationFactorySummary` currently drops `criticalExposureCount`. Pass that field through from the summary response the factory page already gets. Do not add an endpoint. Do not call the ranked-findings list to count rows.
5. Recent changes: `fetchInfraEvidenceSnapshots` page 1 with a small page size, then `fetchInfraEvidenceDiffsForSnapshot` for the newest snapshot only. Use `totalChanges` on the newest diff. Do not load diff change rows.
6. Awaiting verification is `ChangeImplemented` only (`canVerifyRemediationInstance`). When `openInstancesByStatus["VerificationFailed"]` is greater than zero, append "· {n} checks failed" on that same row. Do not add `Executed` into the awaiting count. `Executed` is still waiting for an attestation, which is a different step.
7. Copy when the count is known:
   - `{n} assigned to you` / `None assigned to you`
   - `{n} with critical exposure` / `No critical exposure`
   - `{n} changes since the previous collection` / `No comparison yet`
   - `{n} waiting for a check` / `None waiting for a check`
8. Zero stays visible. A missing field omits the number and keeps the link. Say which field was missing in the session summary.
9. A failed call shows the API reason on that row only. The other rows and the directory still render.
10. Do not also render the SN-MENU-04 tiles (Last collection, Open findings, Frameworks). This section replaces that strip.
11. Leave the Architecture home and the infrastructure overview unchanged.

## Tests

1. All four sources returning data render the four links in the order above, with the counts, above the Findings heading.
2. Zero assigned findings still renders `None assigned to you`.
3. A `VerificationFailed` count appends the checks-failed clause. `Executed` does not increase the awaiting count.
4. A failed factory summary shows its reason on the priority and verification rows and still renders My findings.
5. No diff for the newest snapshot renders `No comparison yet` and links to `/infrastructure/snapshots-drift`.
6. The Architecture product line home does not render "Your work".

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- No new API, no new SQL, no new package.
- Security: same signed-in calls the destination pages already use.
- Scalability: one assigned count, one factory summary, one snapshot page, one diff list. No full finding queue and no inventory rows on Home.
- Reliability: per-row failure.
- Cost: no new collector and no new stored aggregate.
- Neutral surface, `space-y-4`, `p-4`. Counts use `OPERATOR_TYPOGRAPHY.dataValue`.
- Sentence case.
- From `archlucid-ui`, run the Vitest files you touched and `npx tsc --noEmit -p tsconfig.json`.
- Do not commit.

## Done when

SecureNow Home shows the four work links with counts from existing responses, then the existing directory.
