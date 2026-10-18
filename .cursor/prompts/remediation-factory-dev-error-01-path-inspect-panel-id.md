# RF-ERR-01 — Export the remediation factory path inspect panel id

**Wave:** Remediation factory dev log (**RF-ERR**). **Depends on:** none. **Branch:** `cursor/rf-err-path-inspect-panel-id`

## Goal

`RemediationFactoryClient.tsx` can import `REMEDIATION_FACTORY_PATH_INSPECT_PANEL_ID` from `./remediation-factory-page-copy`, and the path inspect section on the remediation factory uses that id.

## Why

Next reports:

`Attempted import error: 'REMEDIATION_FACTORY_PATH_INSPECT_PANEL_ID' is not exported from './remediation-factory-page-copy'`

Import trace: `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx`.

The route still returns HTTP 200. The client bundle does not compile, so Fast Refresh full-reloads. `remediation-factory-page-copy.ts` exports `REMEDIATION_FACTORY_PRIMARY_CONTENT_ID`, `REMEDIATION_FACTORY_SKIP_LINK_LABEL`, and `REMEDIATION_FACTORY_OPEN_WAVES_LABEL` only. `SecurityEvidencePathInspectPanel` is shared with the findings queue and finding inspect, and its root `<section>` has no `id`.

A checkout that does not yet import the symbol still needs the export and the factory wiring, so the running tree and trunk match.

## Read first

- `docs/architecture/REMEDIATION_FACTORY_DEV_ERROR_COMPOSER_PROMPTS.md`
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/remediation-factory-page-copy.ts`
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx`
- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx`

## What to build

1. Export `REMEDIATION_FACTORY_PATH_INSPECT_PANEL_ID = "remediation-factory-path-inspect" as const` from `remediation-factory-page-copy.ts`. Keep the existing three exports.
2. Add an optional `id?: string` prop on `SecurityEvidencePathInspectPanel` and set it on the root `<section>` (`id={props.id}`). Leave `data-testid="security-evidence-path-inspect-panel"` and the aria-label as they are.
3. In `RemediationFactoryClient.tsx`, import `REMEDIATION_FACTORY_PATH_INSPECT_PANEL_ID` from `./remediation-factory-page-copy` and pass `id={REMEDIATION_FACTORY_PATH_INSPECT_PANEL_ID}` on the factory’s `SecurityEvidencePathInspectPanel`. Do not add that id on `GovernanceAssignedToMePathInspectSection`, `FindingInspectView`, or `FindingDetailPageView`.
4. Vitest: the constant equals `remediation-factory-path-inspect`. Rendering the panel with that `id` puts it on the section. Rendering without `id` does not add `id="remediation-factory-path-inspect"`.

## Do not

- Hardcode the factory id inside the shared panel.
- Change Azure Boards fetching (that is **RF-ERR-02**).
- Patch Next router initialization or `global-error` (that is **RF-ERR-03**).

## Done when

The import resolves, the factory section has `id="remediation-factory-path-inspect"`, other path-inspect callers do not, and the named tests pass.
