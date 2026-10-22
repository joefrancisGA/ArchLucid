> **Scope:** Contributor-reference — copy-paste Composer/Cloud Agent prompts so Event Hub and Service Bus cards show what the broker is doing. Internal engineering only. **Prompts only** — do not implement from this page.
> **Index:** [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md).
> **Paste files:** [`.cursor/prompts/messaging-behavior-00-index.md`](../../.cursor/prompts/messaging-behavior-00-index.md).
>
> **Do not** re-run **AX-DE-13** or **SN-PE-05**. Those already collect children, capture, and Sender/Receiver permissions. This wave attaches that evidence to the visible card and uses broker verbs.

# MB-EH and MB-SB — Messaging behavior on the diagram

**Observed:** Full subscription shows Event Hub and Service Bus namespaces with generic **connects** / **May write**, or with no arrow, even when capture, diagnostics, or a data-plane role says what the broker is doing.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| Capture and diagnostics miss the namespace card; Data Sender looks like Contributor | **MB-EH** | Event Hub card stays idle or says **May write** |
| Queue forward and Data Sender never say send / receive / forward | **MB-SB** | Service Bus card stays a box |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **MB-EH** | First | AX-DE-13, SN-PE-05 on trunk |
| **MB-SB** | After MB-EH | Humanizer prefers broker verb over **May write** |

**Run one prompt per chat.** Feature branch per prompt (`cursor/mb-eh-visible-card-af35`, `cursor/mb-sb-visible-card-af35`). Name the branch in any commit/push request.

## Shared constraints

- No new ZIP companion. No consumer groups. No topic-subscription list. No SAS keys.
- No invented producer. Contributor stays **May write**.
- Resource-group and subscription roles do not fan out.
- Diagnostics stay off Data Flow.
- Do not reopen GTM **M-90 / M-44 / M-91 / M-92** or **TB-135 / TB-136**.
- Working-tree: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip.
- **No `git add -A`.** Heartbeat every 8s if compile/test >15s.

---

# MB-EH — Event Hub

**Depends on:** AX-DE-13, SN-PE-05 · **Branch:** `cursor/mb-eh-visible-card-af35`

**Paste file:** [`.cursor/prompts/messaging-behavior-01-event-hub.md`](../../.cursor/prompts/messaging-behavior-01-event-hub.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: Event Hub cards show May publish, May consume, Captures to, and Sends diagnostics to on the namespace when the child hub is not its own node. Enabled capture only. Contributor stays May write. Diagnostics stay off Data Flow. Do not implement Service Bus (MB-SB).

This is NOT a re-run of AX-DE-13 or SN-PE-05. Do not reopen TB-135/TB-136 or GTM M-90/M-44/M-91/M-92.

Read first:
- docs/architecture/MESSAGING_BEHAVIOR_COMPOSER_PROMPTS.md
- .cursor/prompts/messaging-behavior-00-index.md
- .cursor/prompts/messaging-behavior-01-event-hub.md

Working-tree: pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>' (exit 2 → skip).

Implement only What to build in the paste file. Tests must fail on current master, pass after.

Do not git add -A. Heartbeat every 8s if compile/test >15s.
```

---

# MB-SB — Service Bus

**Depends on:** MB-EH · **Branch:** `cursor/mb-sb-visible-card-af35`

**Paste file:** [`.cursor/prompts/messaging-behavior-02-service-bus.md`](../../.cursor/prompts/messaging-behavior-02-service-bus.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: Service Bus cards show May send, May receive, and Forwards to when the queue or topic payload already names a target in the same namespace. Attach to the namespace when the child is not a node. Contributor stays May write. Do not list subscriptions. Do not add ARM calls.

Read first: .cursor/prompts/messaging-behavior-02-service-bus.md and .cursor/prompts/messaging-behavior-00-index.md.

Do not reopen MB-EH except to consume its humanizer order. Working-tree script. No git add -A. Heartbeat every 8s if >15s.
```
