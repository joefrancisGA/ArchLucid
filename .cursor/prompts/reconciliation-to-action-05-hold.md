# RTA-HOLD — Hold

**Wave:** Reconciliation to action (**RTA**). **Not implementation.**

Paste this file only when a session starts a new finding for every gap, a disposition table before the finding link is restored, an automatic Azure change, or a claim that a documentation decision is observed state.

## Hold

| Temptation | Stop |
|------------|------|
| `GET /v1/operational-security/findings` in the browser to rediscover one fingerprint | RTA-01 lookup by source system and source finding id. |
| Create an operational finding for Diagram only, Inventory only, Exact, or a connector gap | RTA-02. Those rows are documentation. |
| Store Update the drawing as a security finding | RTA-03. |
| Auto-close a finding because the next capture lacks the row | RTA-04 labels the documentation decision. Finding status stays put. |
| Count Accept as undocumented as Matched | The match kind is unchanged. |
| Let a documentation decision emit Confirmed or Exact | DIC-02 is a saved human mapping. AI cannot mint Exact. |
| Add a diagram-document table to separate drawings | RTA-05 hashes the parsed nodes and edges onto the existing comparison. |
| List every tenant decision to find a removed box | RTA-06 lists decisions for the current drawing fingerprint. |
| Save a sealed decision through the advisory comparison route | RTA-07 adds a run-linked route. The sealed-manifest guard stays. |
| Delete or skip `DiagramInfrastructureReconciliationSealedManifestHashGuard` | The sealed route stays sealed. |
| Terraform apply, or pushing a gap into Azure | Plane section 8. Verify on a later capture. |
| A second collector or Azure HTTP during compare | The capture and the uploaded file are the inputs. |
| Vision or OCR on PNG, JPEG, PDF, or PowerPoint | DIC hold. Structured files only. |
| Hide desktop review workspace tabs behind **More** | Workspace rule. |
| GTM **M-90 / M-44 / M-91 / M-92**, or reopening **TB-135 / TB-136** | Owner / GTM. |

## If a session is already implementing a hold item

Stop. Revert the uncommitted hold-item code. Point at **RTA-01** through **RTA-07**.
