<!-- Messaging behavior on inventory diagrams — Composer prompts.
     Origin: 2026-09-24 owner ask on the Full subscription diagram:
     connections to Event Hub (and Service Bus) should say what the broker is doing.
     Do not implement from this index. -->

# Messaging behavior — Composer prompt set (MB-EH, MB-SB)

Event Hub and Service Bus cards on the inventory diagram should show what the broker is doing: who may publish or send, who may consume or receive, where capture or forward lands, and (Event Hub only) who sends diagnostics. A namespace does not record its senders. **AX-DE-13** already lists children and Event Hub capture. **SN-PE-05** already maps Sender/Receiver roles to **May write** / **May read**. This set attaches those facts to the card the canvas actually draws and uses broker verbs. It does not collect a new companion.

**Do not implement from this index.** Paste **one** numbered file per session.

| # | File | What it does |
|---|------|----------------|
| 00 | `messaging-behavior-00-index.md` | This index |
| 01 | `messaging-behavior-01-event-hub.md` | **MB-EH** — May publish / May consume, capture on the visible card, diagnostics join |
| 02 | `messaging-behavior-02-service-bus.md` | **MB-SB** — May send / May receive, forward-to on the visible card |

Wave doc: [`docs/architecture/MESSAGING_BEHAVIOR_COMPOSER_PROMPTS.md`](../../docs/architecture/MESSAGING_BEHAVIOR_COMPOSER_PROMPTS.md).

**Run MB-EH first, then MB-SB.** They edit different role names and ARM types. MB-SB assumes the humanizer can keep a stored broker verb instead of collapsing every `CAN_WRITE` into **May write**.

## Already shipped — do not re-do

- **AX-DE-13** — namespace contains hub/queue/topic; `eventHubCapture` hub → storage. No consumer-group list. No SAS keys.
- **SN-PE-05** — `Azure Event Hubs Data Sender` / `Receiver` / `Owner` and the Service Bus equivalents are on `AzureInventoryRbacDataPlaneRoleMap`. Unknown roles stay `None`. Subscription-scoped roles do not fan out.
- **AX-DE-02 / AX-DE-10** — diagnostic settings can name an Event Hub. Label is **Sends diagnostics to**. Diagnostics stay off Data Flow.

## What is still wrong

1. Capture is stored on the child hub ARM id. The Full subscription card is usually the namespace, so **Captures to** never attaches.
2. A diagnostic destination that is `/eventhubs/{name}` or an authorization-rule id does not match the namespace node.
3. `DiagramEdgeLabelHumanizer.TryResolveAuthorizedAccessLabel` turns every `CAN_WRITE` with `inventory-app-authorized-access` into **May write** before the stored label is read. Data Sender and Contributor look the same.
4. `AzureInventorySnapshotSameResourceGroupEdgeHydrator.IsDataStore` treats Event Hub and Service Bus as colocated Data Factory stores.

## Global constraints

- Plane wins. One Azure collector. No `terraform apply` / ARM writes. No second collector. No new ZIP companion. No consumer-group or subscription-rule list. No SAS keys or authorization rules persisted.
- Do not invent a producer because a hub, queue, or topic exists.
- Do not relabel built-in `Contributor` or `Owner` as publish/send. Those stay **May write** / **May access**.
- Resource-group and subscription role assignments do not fan out onto every hub or queue.
- Diagnostics stay off Data Flow. On Full subscription they stay telemetry (**Sends diagnostics to**), not event traffic.
- Do not reopen **AX-DE-01–18**, **SN-PE-01–07**, **AX-DC**, or **SN-DF** as greenfield. Do not reopen GTM **M-90 / M-44 / M-91 / M-92** or **TB-135 / TB-136**.
- Working-tree: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip and report.
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.
- Implement only *What to build*.

Suggested implementation branch per prompt: `cursor/mb-eh-visible-card-af35` and `cursor/mb-sb-visible-card-af35`. Name the branch in any commit/push request.
