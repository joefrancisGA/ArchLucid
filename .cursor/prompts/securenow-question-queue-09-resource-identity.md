# SN-QQ-09 — Name the resource, say why, and show its neighborhood

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-QQ prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_QUESTION_QUEUE_LUNA_PROMPTS.md`

**Depends on:** SN-QQ-03. The subscription question card already exists. SN-QQ-04 through SN-QQ-08 may already be on the branch. Do not rebuild them.

## Goal

A question about a resource names that resource before it asks anything. The card shows the friendly resource type, then the resource name, then the question, then a plain reason SecureNow is asking. The diagram behind that card is the resource's dependency neighborhood, and the resource node is highlighted.

## Why

The open card currently says "Should this resource connect to a peer, or stand alone?" beside the tag "Inventory evidence." The subscription can have dozens of those rows. The diagram under the card is the full data-flow graph, so the reader cannot tell which node the question is about. The compiler already knows the ARM id and the problem text. The card drops both.

## Read first

- `ArchLucid.Application/InfraEvidence/SecureNowQuestionDispositions/SecureNowQuestionCompiler.cs`
- `ArchLucid.Application/InfraEvidence/SecureNowQuestionDispositions/SecureNowQuestionDispositionService.cs` (`BuildDiagramCandidates`)
- `ArchLucid.Contracts/InfraEvidence/SecureNowQuestionDispositionContracts.cs` (`SecureNowQuestionResponse`)
- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/SecureNowQuestionRecord.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramArmTypeFriendlyName.cs`
- `archlucid-ui/src/components/infra-evidence/SecureNowQuestionQueue.tsx`
- `archlucid-ui/src/lib/infra-evidence/securenow-question-queue-api.ts`
- `archlucid-ui/src/lib/infra-evidence/format-diagram-arm-type-friendly-name.ts`
- `archlucid-ui/src/lib/infra-evidence/format-azure-resource-display.ts` (`normalizeSecureNowResourceNameForDisplay`)
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` (`applySeedNode`, `handleOutlineFocusNeighborhood`, `ArchitectureDiagramViewer`)
- `archlucid-ui/src/lib/architecture/architecture-diagram-camera-focus.ts`
- `docs/library/UI_DESIGN_SYSTEM.md` § Capitalization

## What to build

### Identity on the question row

Add three fields to `SecureNowQuestionRecord` and `SecureNowQuestionResponse`. Map them through the questions controller and `securenow-question-queue-api.ts`.

| Field | Meaning |
| --- | --- |
| `resourceType` | ARM type from the inventory row. Empty when the question has no resource. |
| `resourceName` | Last segment of the ARM id, lowercased the way diagram labels already are. Empty when the question has no resource. |
| `reasonText` | The sentence under "Why SecureNow is asking." |

`Reason` on the disposition stays the ignore or reopen reason. Do not store `reasonText` there.

Do not change the evidence fingerprint. It stays a hash of the question key, the normalized resource id, and the problem text or inference endpoints. A copy change must not expire an existing answer.

Rewrite only the generic inventory sentences.

- `unknown-evidence@v1`: question text is `Should {resourceName} connect to a peer, or stand alone?` Reason: `SecureNow found no connection to or from {resourceName}. {Friendly type} is not treated as a shared service that can stand alone.`
- `orphan-still-needed@v1`: question text is `Is {resourceName} still needed?` Reason: `SecureNow could not find the parent {resourceName} requires.`

Friendly type comes from `DiagramArmTypeFriendlyName.TryFormat`. When that returns null, the reason uses `This type` as the second sentence: `This type is not treated as a shared service that can stand alone.`

When an inferred question already names the resources, keep that `questionText`. Set `reasonText` to `SecureNow inferred a connection and needs a person to confirm it before recording it.` Still fill `resourceType` and `resourceName` from the row's resource id when the snapshot has that resource. Replace only the fallback `Should SecureNow record this inferred connection?`, and only when a resource name exists, with `Should SecureNow record an inferred connection for {resourceName}?`

A row with an empty resource id keeps its current question text. `resourceType`, `resourceName`, and any invented type line stay empty. Its `reasonText` is `SecureNow needs an answer before it can record this.` when the compiler has no more specific sentence. `sourceLine` stays `Inventory evidence`, `Inferred connection`, or `Policy pack`.

Answer codes stored on the row do not change.

### Card

On `infra-diagrams-question-drawer`, for a row with a resource name, render in this order:

1. Friendly type, from `formatDiagramArmTypeFriendlyName(resourceType)`. Omit the line when that returns null. Do not show the raw ARM type.
2. Resource name.
3. The question.
4. The heading `Why SecureNow is asking`, then `reasonText`.
5. `sourceLine` in helper type, with no second heading.

Sentence case for the heading. The friendly type uses the same words as the Nodes table. The resource name uses `normalizeSecureNowResourceNameForDisplay`. Do not show the full ARM id on the card.

Move the open question card so it sits immediately above `ArchitectureDiagramViewer`. Leave the hero (`infra-diagrams-question-hero`) where it is now, above the diagram filters. Do not add a second diagram, a second queue, or a workspace tab.

Answer buttons show these labels. The value sent to the API stays the code.

| Code | Label |
| --- | --- |
| `NamePeer` | Name the peer |
| `StandsAlone` | It stands alone |
| `NotSure` | Not sure |
| `Retire` | Retire |
| `Keep` | Keep |
| `Yes` | Yes |
| `No` | No |
| `Register` | Register |
| `NotASessionHost` | Not a session host |

Any other code shows that code as its label.

### Neighborhood

When the visible question has a non-empty resource id, call the existing `applySeedNode` path with that ARM id. That switches the workbench to dependency neighborhood and frames the seed plus its neighbors through the current camera. Do this again when Previous or Next lands on a different resource. A question with an empty resource id does not change the seed.

Highlight only the seed node. Add `data-securenow-question-subject="true"` on that node and a visible accent stroke around the node boundary. Neighbors stay in the frame and do not get that attribute or stroke. Do not crop, flip, rotate, or redraw an Azure architecture icon. Stroke the node, not the icon art.

A neighborhood with one node and no edges stays on screen. That empty picture is the evidence. Do not fall back to the full subscription graph. Closing the card does not change the diagram mode.

If the seed render fails, leave the previous diagram up and show the existing load error. Do not clear the question.

## Tests

1. An unknown-evidence resource whose id ends in `adf-edw-hi-dev` and whose type is `Microsoft.DataFactory/factories` returns question text `Should adf-edw-hi-dev connect to a peer, or stand alone?`, that resource name, that ARM type, and a reason that names the resource and says the type is not a shared service. Answer codes stay `NamePeer`, `StandsAlone`, `NotSure`. The fingerprint inputs are unchanged.
2. An orphan-intent resource returns `Is {name} still needed?` and a reason that the parent was not found. Answer codes stay `Retire`, `Keep`, `NotSure`.
3. An inferred question whose text already names both ends keeps that text, fills the resource name from the resource id, and uses the inferred-connection reason.
4. The drawer shows the friendly type, then the name, then the question, then `Why SecureNow is asking` and the reason, then the source line.
5. The visible button for `NamePeer` reads `Name the peer`. The answer request still sends `NamePeer`.
6. Showing a resource question calls the seed callback with that resource id. A question with an empty resource id does not.
7. The subject marker is applied to the seed node and not to a neighbor.

Do not require the `ArchitectureDiagramViewer` zoom suite. It fails for unrelated camera reasons in jsdom.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- One class per file. No `ConfigureAwait(false)` in tests.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`
- From `archlucid-ui`, run the SecureNow question queue tests and `npx tsc --noEmit -p tsconfig.json`.
- If the questions response schema changes, regenerate contracts. Do not hand-edit the JSON. From the repo root: `ARCHLUCID_REGENERATE_UI_API_TYPES=1 bash scripts/ci/update_openapi_contract_snapshot.sh`, then `bash scripts/ci/update_buyer_openapi_contract_snapshot.sh` when the buyer snapshot still contains `SecureNowQuestionResponse`.
- Do not commit.
- Do not write to customer Azure.
- Do not hide a diagrams tab behind More.
- Do not add a control named Resolve.
- Do not change ignore, reopen, or answer persistence.

## Done when

The open card names the type, then the name, then the question, and states why SecureNow is asking. The diagram is that resource's neighborhood, with that node highlighted.
