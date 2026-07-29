> **Reviewed:** 2026-07-28
>
> **Scope:** Principal-architect explanation of model ingress and prohibited model side effects (GTM **M-149**). Not an assurance attestation.

# LLM trust boundary: ingress (PA one-pager)

**Audience:** Principal architects and security reviewers assessing AI agent boundaries.

**Verdict:** The host composes what enters the model: architecture request, evidence, technology ledger, and host-selected retrieval. The model has no HTTP, shell, or ITSM tool loop to cause those side effects directly; it can still influence generated finding text.

## Ingress / impossible matrix

| Boundary question | Current posture |
| --- | --- |
| What enters the model? | Host-selected request data, evidence package, technology ledger, and retrieval context. |
| Can model output alter finding prose? | Yes; output quality and governance controls must evaluate it. |
| Can it call arbitrary HTTP or shell tools? | No model-driven tool loop for those capabilities. |
| Can it create ITSM work directly? | No model-driven ITSM side-effect loop. |
| Are all tool states fail-closed? | Not yet: empty `AllowedTools` remains a tracked residual. |

## Too-strong vs safe

| Too strong | Safe |
| --- | --- |
| “Customer documents are injection-proof.” | Untrusted content enters a host-composed, confined model boundary. |
| “The model cannot influence findings.” | It can influence generated text; it cannot directly invoke the listed side-effect loops. |
| “Tool allowlists are complete.” | Dispatch guarding is shipped, while empty `AllowedTools` closure remains open. |

## Reviewer check

1. Identify the host-owned inputs to a representative completion request.
2. Ask whether output can invoke HTTP, shell, or ITSM actions without host code.
3. Confirm the treatment of an empty `AllowedTools` list before accepting an allowlist claim.

## Posture

| Concern | Posture |
| --- | --- |
| Security | Host-composed ingress and constrained tools reduce model-directed side effects. |
| Scalability | Boundary enforcement is host-side and applies consistently per completion. |
| Reliability | Content Safety can gate content but does not eliminate influence on text. |
| Cost | There is no claim of a separate prompt-firewall service; model use still consumes tokens. |

## Honest residuals

- **TB-082** is Done for `AgentTaskAllowedToolsDispatchGuard`.
- Empty/unrestricted `AllowedTools` behavior is still a residual under **TB-950**.
- **TB-997**–**TB-998** remain open for the PA ingress/impossible contract and claim guard.
- This does not promise prompt-injection proof; see **M-115** / **M-116**.

**Related:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#prompt-injection-resistance-m-115`](BUYER_SECURITY_PROCUREMENT_PACKET.md#prompt-injection-resistance-m-115) (`PROMPT_INJECTION_RESISTANCE_BUYER_ONE_PAGER.md` alias) · [`SYSTEM_THREAT_MODEL.md`](../security/SYSTEM_THREAT_MODEL.md) · [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise).
> **Reviewed:** 2026-07-28

> **Scope:** PA handout for LLM trust-boundary ingress vs impossible side effects (GTM **M-149** / **TB-997**). Extends **M-115**/**M-116**.

# LLM trust boundary — ingress vs impossible

**Audience:** Security reviewers and principal architects.

**Claim:** Promise **host-composed ingress** and **no model tool-loop** for HTTP/shell/ITSM side effects. Do **not** promise injection-proof customer docs or that the model cannot influence findings text. Residual empty-`AllowedTools`: **TB-950**.

---

## What enters the model

| Ingress | Treatment |
| --- | --- |
| Brief / attachments / repo excerpts | Untrusted DATA in host-composed prompts |
| Retrieval chunks | Scoped hits only (**M-152**/**M-153**) |
| Prior agent prose | May influence later findings — quarantine vs package rules (**M-203**) |

---

## Structurally impossible (intent)

| Side effect | Expectation |
| --- | --- |
| Arbitrary HTTP/shell from model tool-loop | Not allowed |
| ITSM create via unconstrained model tools | Not allowed |
| Cross-tenant read via prompt alone | Blocked by identity/scope (**M-114**/**M-151**) — not by “filtering the PDF” |

---

## Too strong vs safe

| Too strong | Safe |
| --- | --- |
| “Model cannot influence finding text” | Prose influence residual; package truth is committed manifest |
| “Empty AllowedTools is safe” | **TB-950** residual |

**Related:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#prompt-injection-resistance-m-115`](BUYER_SECURITY_PROCUREMENT_PACKET.md#prompt-injection-resistance-m-115) (`PROMPT_INJECTION_RESISTANCE_BUYER_ONE_PAGER.md` alias).
