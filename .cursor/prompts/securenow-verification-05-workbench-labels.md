# SN-VF-05 — Workbench labels for advisory, implemented, and verified

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Requires:** SN-VF-04 is already in the tree, including `ChangeImplemented` on the remediation status union.

## Goal

The remediation workbench must show three different facts: an advisory artifact was generated, a person attested that the change was implemented, and verification passed. Close is offered only after verification passed.

## Why

`mapRemediationInstanceStatusToColumn` labels `Executed` as the `executed` column, but `ExecuteAsync` only emits advisory Terraform or a checklist. `canCloseRemediationInstance` returns true for `VerificationFailed`, while `CloseAsync` rejects anything other than `Verified`. The UI offers an action the API refuses. SN-VF-04 mapped `ChangeImplemented` onto `executed` only so the union would compile.

## Read first

- `archlucid-ui/src/lib/infra-evidence/infra-evidence-remediation-stages.ts`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-remediation-stages.test.ts`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-remediation-types.ts`
- `archlucid-ui/src/lib/infra-evidence/remediation-lifecycle-action-blocked-reason.ts`
- `archlucid-ui/AGENTS.md` (sentence case, button versus link)
- `.cursor/rules/UI-Enterprise-Design-Standard.mdc`

## What to build

Visible labels, sentence case:

| Status | Visible label |
|--------|----------------|
| `Executed` | Advisory generated |
| `ChangeImplemented` | Change implemented |
| `Verified` | Change verified |
| `VerificationFailed` | Verification failed |

`VerificationFailed` must not use the Change verified label. Give it its own column id if the current `verified` column cannot say two different things.

`canVerifyRemediationInstance` is true only for `ChangeImplemented`.

Add `canAttestChangeImplemented`, true only for `Executed`, and use it from the lifecycle action helper so the attest action appears only in that state. Call the existing attest endpoint from SN-VF-04. Do not add a second client.

`canCloseRemediationInstance` is true only for `Verified`.

Keep `REMEDIATION_EXECUTE_DISCLAIMER`. The advisory column must not say the change was applied to Azure.

Update every switch that maps these statuses, including `infra-evidence-remediation-stages.test.ts`. The test that expects `VerificationFailed` to map to `verified` must expect the verification-failed column instead.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Do not change the evaluator, the status integers, or the attest API.
- Do not collapse workspace tabs into a More menu.
- Button means do something. A navigation jump is a link.
- From `archlucid-ui/`, run the Vitest file `src/lib/infra-evidence/infra-evidence-remediation-stages.test.ts` and any lifecycle-action test you change.
- Do not commit.

## Done when

A reviewer can tell advisory output, an attested change, a passed verification, and a failed verification apart on the workbench, and Close is not offered after a failed verification.
