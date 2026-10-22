# DIC-06 — Hold

**Wave:** Diagram import comparison (**DIC**). **Not implementation.**

Paste this file only when a session starts vision, a new diagram format, a sealed-review bypass on the old route, or a claim that the drawing is observed Azure state.

## Hold

| Temptation | Stop |
|------------|------|
| Default-on vision or OCR for PNG, JPEG, PDF, or PowerPoint | Structured files only. Vision stays off. |
| A PowerPoint or legacy `.vsd` parser | Ask for `.vsdx` or draw.io. |
| Delete or skip `DiagramInfrastructureReconciliationSealedManifestHashGuard` on `POST /v1/architecture/runs/{runId}/diagrams/reconcile` | DIC-01 adds a parallel advisory path. The run-linked path stays sealed. |
| Treat Confirmed, Exact, or a connector gap as ObservedFact or observed traffic | Advisory documentation accuracy. |
| Let the matcher emit Confirmed without a saved human mapping | DIC-02. AI cannot mint Exact. |
| Compare `appAuthorizedAccess` or `hostnameInferredTarget` as drawn-versus-present gaps | DIC-03 structural list only. |
| Implement **DAU-08** on the inventory diagram canvas inside a DIC session | DIC-05 paints the imported drawing on the reconcile page. |
| Terraform apply, or pushing a gap into Azure | Plane §8. Verify on a later capture. |
| A second collector or Azure HTTP during compare | The capture and the uploaded file are the inputs. |
| Hide desktop review workspace tabs behind **More** | Workspace rule. |
| GTM **M-90 / M-44 / M-91 / M-92**, or reopening **TB-135 / TB-136** | Owner / GTM. |

## If a session is already implementing a hold item

Stop. Revert the uncommitted hold-item code. Point at **DIC-01** through **DIC-05**.
