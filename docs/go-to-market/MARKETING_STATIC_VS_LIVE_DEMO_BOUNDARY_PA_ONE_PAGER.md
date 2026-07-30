> **Reviewed:** 2026-07-28
>
> **Scope:** Principal-architect diligence handout for GTM **M-179**. This is a bounded buyer claim, not an assurance attestation.

# Marketing static vs anonymous-live vs tenant boundary (PA one-pager)

**Audience:** Principal architects, security reviewers, and demo owners.

## Claim / verdict

**Verdict:** Keep the static pitch, anonymous sample, and signed-in tenant planes visibly separate. The welcome-to-see-it-to-CTA path must use either a Claims-only static route or an explicitly Contoso-labeled live route; a universe mismatch fails closed.

## Statement / meaning

| Statement | Meaning |
| --- | --- |
| Product claim | Keep the static pitch, anonymous sample, and signed-in tenant planes visibly separate. The welcome-to-see-it-to-CTA path must use either a Claims-only static route or an explicitly Contoso-labeled live route; a universe mismatch fails closed. |
| Evidence boundary | The named artifact explains the mechanism or decision boundary; it does not independently prove a commercial outcome. |
| Status | Any referenced open work remains planned until its owner marks it Done. |

## Too strong vs safe

| Too strong | Safe |
| --- | --- |
| Serving a Contoso anonymous preview under Healthcare Claims copy proves a tenant-accurate live demo. | Keep the static pitch, anonymous sample, and signed-in tenant planes visibly separate. The welcome-to-see-it-to-CTA path must use either a Claims-only static route or an explicitly Contoso-labeled live route; a universe mismatch fails closed. |
| A roadmap item or architecture test proves the whole product boundary. | Inspect the named path and state the residual before using the claim. |
| A buyer can infer a certification or measured outcome from this handout. | Buyer-specific diligence and measured evidence remain separate. |

## Reviewer check

1. Ask for the named technical or claim anchor and verify the current implementation status.
2. Test the boundary described by the safe statement, not a broader interpretation of it.
3. Record any exception against the residual owner before repeating the claim in a customer artifact.

## Posture

| Concern | Posture |
| --- | --- |
| Security | The claim is limited to documented controls and does not turn design intent into a certification. |
| Scalability | It makes no unmeasured capacity promise beyond the cited architecture. |
| Reliability | Failure and asynchronous states stay visible rather than being represented as successful completion. |
| Cost | It makes no unmeasured savings, quota, or total-cost guarantee. |

## Residuals (honest)

- **Open owners / evidence:** ADR 0027; `ui_routes.md` Tier 1/2; **TB-1028**/**TB-1029**.
- **Boundary:** One universe per page; anonymous preview is not tenant data; Northwind remains off-funnel.
- Planned artifacts and test-only controls do not establish the production boundary.
- This handout does not claim CPA SOC 2 attestation or a published third-party penetration test, and it does not reopen **TB-135** or **TB-136**.

## Related links

- [`GTM_BACKLOG.md`](GTM_BACKLOG.md) - **M-179**.
- [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md).
- [`PA_CLAIM_HONESTY_INDEX.md`](PA_CLAIM_HONESTY_INDEX.md).
