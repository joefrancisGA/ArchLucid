# SRI-03 — Upload sits on the first screen with the name

**Wave:** start-review-intake (**SRI**). **Depends on:** SRI-01. May run in parallel with SRI-02.

Follow [`.cursor/prompts/start-review-intake-00-index.md`](start-review-intake-00-index.md) global constraints.

## Goal

The empty-workspace first screen shows the evidence upload in the same view as System Name and the brief. A diagram, document, IaC file, or inventory ZIP can be attached before clarifications. Continue does not require a file.

## Why

The page lead already says a review starts from a diagram, brief, or document, and that an inventory ZIP is attached with evidence. `GuidedIntakeEvidenceSection` implements that, and `GUIDED_INTAKE_EVIDENCE_UPLOAD_DESCRIPTION` already names diagrams, documents, IaC, and Azure/AWS/GCP inventory ZIPs. On the step-0 card the section sits under the actor editor, and until SRI-01 the card never mounted. A person who brought files should see the drop zone with the questions, not after them.

## Context

- `GuidedIntakeEvidenceSection.tsx` — `data-testid="guided-intake-evidence-section"`, `WizardEvidenceUploadZone`.
- `SocraticIntakeWizardStepScope.tsx` — evidence section is rendered after the brief fields and before or beside `DraftIntakeActorEditor`. Move it up; do not build a second uploader.
- Pending files upload when the review starts (`uploadWizardPendingDocumentEvidence` in `use-guided-intake-draft-submit.ts`). Keep that timing so files are not stored against a missing review. Show the selected file names on the form before submit.
- Copy to keep: `GUIDED_INTAKE_EVIDENCE_UPLOAD_DESCRIPTION`.

## What to build

1. On step 0, render `GuidedIntakeEvidenceSection` directly under the System Name and brief fields, and above the actor editor.

2. The zone stays enabled on the empty-workspace screen (not `disabled` except while a submit is in flight). Selected names stay visible. Upload remains optional: continue's disabled state comes from the name and the brief minimums, not from an empty file list.

3. Do not add a second cloud-connection form on this screen. The header's cloud sentence stays a hint (SRI-05). Inventory ZIP uses this same zone.

4. Tests:
   - Empty-workspace step 0 contains `guided-intake-evidence-section` and the System Name field in the same panel.
   - The evidence section appears before the actor editor in DOM order.
   - Continue can proceed with zero files when the name and brief minimums pass.
   - A selected file name is shown before submit, and the existing deferred-upload helper is what runs at start.

## Acceptance criteria

- Diagram, brief document, and inventory ZIP are actions on the first screen.
- A review can still start from text alone.

## Constraints

- **Do not** upload files before a draft or review id exists.
- **Do not** require a file to leave step 0.
- **Do not** invent a new inventory-ZIP endpoint.

## Done when

The first screen shows the name, the brief, and the upload zone together, and a file is optional.
