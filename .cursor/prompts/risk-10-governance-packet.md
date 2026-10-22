# Risk & Tradeoffs — Step 10: Governance Packet Extension

## Context

Extend `ExecutiveReviewPacketComposer` to include the Risk & Tradeoffs section
as described in `docs/architecture/analyzer_component.md` §0.2 (rev 7).

The governance packet is the slide the architect carries into a steering committee.
It is **not** an executive dashboard or a separate login. It is an artifact
composed from the architect's view and rendered in executive consequence language.

Prerequisites: All prior steps must be complete.

## What changes in `ExecutiveReviewPacketComposer`

Add a `RiskAndTradeoffsSection` to the packet output. This section:

1. **Includes only evidence-backed items** — tradeoffs (all statuses) and
   requirement smells. Suggested concerns are **never** in the governance packet.
2. **Uses executive consequence rendering** for each conflicting tradeoff:
   - Source: `explanationExecutive` from the `RiskSnapshot`.
   - Format: "[mechanism label] creates a [schedule / cost / compliance] exposure
     on this initiative."
   - No fabricated probability or percentage.
3. **Lists acknowledged tradeoffs** as "Explicit bets this design is making:"
   bullet list. No flagging — these are stated and accepted.
4. **Lists unacknowledged tradeoffs** as "Unvalidated assumptions:" bullet list.
5. **Lists requirement smells** (undispositioned only) as "Requirements awaiting
   confirmation:" bullet list.
6. **Includes a clean assurance statement** if no conflicts exist:
   "No conflicts found between this design and its stated requirements."

## New method signature

```csharp
// In ExecutiveReviewPacketComposer (or a new partial class / decorator):
public Task<GovernancePacketSection> ComposeRiskSectionAsync(
    RiskSnapshot snapshot,
    string tenantId,
    CancellationToken cancellationToken = default);
```

The section is added to the existing packet after the existing findings sections.

## Packet export format

- Continue using the existing export format (PDF or HTML, whichever the
  `ExecutiveReviewPacketComposer` already produces).
- Risk section header: **"Risk & Tradeoffs"**
- Sub-header (conflict section): **"Conflicts with stated requirements"** —
  shown only if any Conflicting tradeoffs exist.
- Sub-header (bets section): **"Architecture tradeoffs"**
- Sub-header (smells section): **"Requirements awaiting confirmation"** —
  shown only if any undispositioned smells exist.

## API endpoint

Extend or add a route to download the governance packet with the risk section:

`GET /api/v1/reviews/{reviewRunId}/governance-packet`

If this route already exists, add the risk section to the existing response.
If not, create it. Returns the artifact (PDF or HTML).

## Unit tests

- `ComposeRiskSectionAsync` with one Conflicting tradeoff → section contains
  exactly one "exposure" sentence, no probabilities, no concerns.
- Suggested concerns in the snapshot → NOT present in the packet output.
- Zero-conflict snapshot → "No conflicts found" assurance statement present.
- Undispositioned smells → appear in "Requirements awaiting confirmation".
- Already-dispositioned smells → do NOT appear.

## Guardrails

- **No suggested concerns in the governance packet** — verify this with a test.
- **No fabricated probabilities** — assert that output text does not match
  `/\d+%/` or `/\d+ percent/`.
- Consequence rendering uses only the `explanationExecutive` field from the
  snapshot; never re-generates it.
- Follow the existing `ExecutiveReviewPacketComposer` code structure; do not
  rewrite the class.
