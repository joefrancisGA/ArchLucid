# SN-QQ-03 — Hero when questions are open, then one question at a time

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement SN-QQ-04 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_QUESTION_QUEUE_LUNA_PROMPTS.md`

**Depends on:** SN-QQ-02. The list endpoint already returns the deduped queue.

## Goal

When a subscription has open questions, the diagrams workbench says how many and lets the reader answer them one at a time. When it has none, the workbench does not say so.

## Why

`InferenceQuestionnairePanel` stays on the page and, with an empty list, says "No proposed questionnaire items remain for this snapshot." The owner does not want that sentence. Diagram-evidence questions and inference items are one count. The distinction belongs in the question wording, not in a second panel.

## Read first

- `archlucid-ui/src/components/infra-evidence/InferenceQuestionnairePanel.tsx`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` (the panel mount, and `focusNodeIds={cameraFocusNodeIds}`)
- `archlucid-ui/src/lib/infra-evidence/operator-inferred-connection-api.ts`
- The SN-QQ-02 list response

## What to build

Add a client for `GET v1/infra-evidence/snapshots/{snapshotId}/questions`.

Above the diagram, when the open count is greater than zero, render:

`SecureNow has 1 question about this subscription.` or `SecureNow has {n} questions about this subscription.`

Then a button, `Start answering`. `data-testid="infra-diagrams-question-hero"`.

When the open count is zero, render nothing. Remove the empty inference sentence. Unmount `InferenceQuestionnairePanel` from the workbench. Inference rows that are still proposed arrive inside this queue. Yes still confirms and No still dismisses through the existing operator-inferred API. Do not delete that API.

`Start answering` opens a side drawer, not a modal. `data-testid="infra-diagrams-question-drawer"`. The diagram stays visible.

The drawer shows one open question:

- The plain question.
- One line, `Why SecureNow is asking`, whose text is the source line from the API (`Inventory evidence`, `Inferred connection`, or `Policy pack`).
- The answer codes as buttons. `NotSure` stays open and advances.
- `Skip` advances and stores nothing. It is remembered only in component state for this visit.
- `Don't ask again` asks for a reason, then calls the SN-QQ-01 ignore API. Default expiration is 90 days. The client sends the fingerprint from the list row.
- Previous and next.
- When the row has a resource id, set `cameraFocusNodeIds` so the existing viewer focuses that node. A row with no resource id does not move the camera.

Cap a visit at 10 open questions. The hero count is the full open count. The drawer says when more remain after those 10.

Filters inside the drawer: `Open`, `Answered`, `Dismissed`. Dismissed lists `Ignored` rows. Each answered or dismissed row has `Reopen`, which calls the reopen API with a reason.

Do not name any control Resolve. Do not add a workspace tab. Do not put this hero on a route other than the diagrams workbench.

## Tests

1. Open count zero renders no hero and no "no questionnaire" sentence.
2. Open count 2 renders the hero with that count. `Start answering` shows the first question and the source line.
3. Skip does not call ignore or answer. The next question is shown.
4. Don't ask again without a reason does not call the API.
5. An inference row's Yes control calls the existing confirm API, not a new answer record.
6. A resource question sets the focus node id. A subscription-scoped question does not.
7. The eleventh open question is not in the drawer. The hero still shows the full count.

Use the workbench and panel test files that already cover this surface. Do not require the `ArchitectureDiagramViewer` zoom suite to pass. That suite fails for unrelated camera reasons in jsdom.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- From `archlucid-ui`, run the focused vitest files you changed, then `npx tsc --noEmit -p tsconfig.json`.
- Do not commit.
- Do not write to customer Azure.
- Do not hide a diagrams tab behind More.

## Done when

A subscription with open questions shows one hero and one drawer, a subscription with none shows neither, and the empty inference sentence is gone.
