> **Scope:** Contributor-reference — LLM trust-boundary ingress vs confinement (TB-997); host-composed prompts and no unconstrained model tool-loop versus claim honesty.

# LLM trust-boundary — ingress vs confinement (**TB-997**)

> **Audience:** Contributors, principal architects, and GTM claim reviewers.  
> **Not** a buyer assurance claim — host-composed ingress + no model tool-loop ≠ injection-proof documents or zero influence on finding text.

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#llm-trust-boundary-ingress-m-149) (GTM **M-149**).  
**Claim honesty:** [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md) (GTM **M-148** / **M-149**).  
**Delimiter hygiene:** [`CUSTOMER_CONTENT_PROMPT_COMPOSER_CONTRACT.md`](CUSTOMER_CONTENT_PROMPT_COMPOSER_CONTRACT.md) (**TB-949** Done).  
**Threat model:** [`SYSTEM_THREAT_MODEL.md`](../security/SYSTEM_THREAT_MODEL.md).

---

## Decision in one line

The host decides what enters Azure OpenAI prompts. The model has **no** unconstrained tool-loop for HTTP, shell, file exfil, ITSM/ADO/email writes, or governance finalize. The model **can** still influence generated finding prose; Content Safety and delimiters are hygiene layers, not a proof boundary.

---

## (A) Ingress — what leaves the trust boundary into the model

| Ingress class | Examples | Host treatment |
|---------------|----------|----------------|
| Architecture request | Brief, system context, constraints | Host-composed; customer prose inside DATA delimiters (**TB-949**) |
| Evidence / attachments | Uploaded docs, evidence package excerpts | Untrusted DATA; redaction / Content Safety may gate |
| Technology ledger | Structured inventory | Preferred structured channel (may sit outside DATA section) |
| Retrieval / Ask | Question + scoped chunks | Host-selected hits only (tenancy: **TB-1001** / GTM **M-152**/**M-153**) |
| Task / agent framing | Objectives, tool-key hints, system instructions | Trusted host text **outside** DATA section |
| Prior agent prose | Earlier agent outputs in the same run | May influence later findings — still host-composed |

---

## Hygiene (layered — not the confinement boundary)

| Control | Role | Owner |
|---------|------|-------|
| Azure AI Content Safety | Severity gates on prompt/completion paths | Content Safety options / **TB-212** |
| `PromptFieldRedactor` / evidence sanitizers | Strip obvious injection/secret patterns | AgentRuntime / Application |
| Static prefix / cache ordering | Trusted instructions before variable DATA | **TB-681** Done |
| `CUSTOMER_CONTENT_BEGIN`/`END` + framing | Delimit untrusted customer text | **TB-949** Done |
| Production-like empty/null `AllowedTools` fail-closed | No unrestricted dispatch by accident | **TB-950** Done (`*` = explicit unrestricted sentinel) |
| Indirect injection corpus / CI | Regression pressure on doc/README override tricks | **TB-951** Done |

---

## (B) Structurally impossible today (no model tool-loop)

| Capability | Why impossible | Notes |
|------------|----------------|-------|
| Arbitrary HTTP from model tool-loop | Completions are text; handlers do not expose a general fetch tool | Residual: inventory arch test **TB-952** (open P2) |
| Shell / local file exfil via model tools | No shell/file tools on the agent completion path | Same |
| ITSM / ADO / email create from unconstrained model tools | Integration writes are host APIs after operator/governance paths | Not “model pressed Create ticket” |
| Governance accept / waive / finalize | Domain mutations require authorized host APIs + audit | Not completion-driven |
| Unconstrained handler dispatch when `AllowedTools` empty/null on prod-like hosts | **TB-082** + **TB-950** fail-closed | Explicit `*` required for unrestricted |

---

## (C) Residual — do not claim closed

| Residual | Buyer-visible risk | Owner |
|----------|-------------------|-------|
| Model influences finding wording | Findings may include injected or low-quality prose until quality/governance gates | Quality gate / Critic / human review — not “injection-proof” |
| Indirect injection via docs/README in corpus | Partial coverage via **TB-951**; not 100% detection | Eval corpus; no absolute claim |
| Side-effect surface inventory completeness | Need arch test that handlers cannot grow arbitrary HTTP/shell | **TB-952** open |
| Cross-tenant via prompt alone | Blocked by scope/catalog DiD (**M-114** / **M-151**), not by PDF filtering | Isolation contracts |

---

## Explicit non-claims

- Do **not** say customer PDFs/docs are injection-proof.
- Do **not** say the model cannot influence finding text.
- Do **not** equate Content Safety or delimiters with a complete security boundary.
- Do **not** mark **TB-952** Done by publishing this matrix.

---

## Follow-on

| ID | Owns |
|----|------|
| **TB-998** | Honesty CI / doc guard against absolute injection-proof / tool-loop overclaims (**M-148**) |
| **TB-952** | Agent side-effect surface inventory + architecture test |

---

## Related

- GTM **M-115** / **M-116** / **M-148** / **M-149**
- [`TECH_BACKLOG.md`](TECH_BACKLOG.md) **TB-082**, **TB-949**–**TB-952**, **TB-997**, **TB-998**
- Polly ≠ run completeness: [`POLLY_VS_RUN_LEVEL_SEMANTICS_CONTRACT.md`](POLLY_VS_RUN_LEVEL_SEMANTICS_CONTRACT.md) (**TB-995**)
