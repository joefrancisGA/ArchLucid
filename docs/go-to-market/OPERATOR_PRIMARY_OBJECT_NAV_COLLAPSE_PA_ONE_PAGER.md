> **Reviewed:** 2026-07-28



# Operator primary object and navigation collapse



**Audience:** Principal architects, product reviewers, and GTM copy owners.

**Decision:** The hireable unit is the **architecture package** (committed golden manifest + evidence trail); findings and decisions are children; create and review are lifecycle verbs — not two equal products.



## Object hierarchy



| Noun | Role | Collapse risk |

| --- | --- | --- |

| Architecture package | Primary product object | Substituted by findings list |

| Review / run | Lifecycle container | Bare `run` in buyer copy |

| Finding | Child signal | Treated as unit of truth |

| Decision | Governance child | Equated to finalized package |

| Create / Review | Verbs on package spine | Dual headline as two products |



Canonical operator spine: `/reviews` and `/reviews/{runId}` package context. `/governance/findings` as default home collapses the primary object.



## PA review



1. Walk first-session navigation: does the PA reach finalize + export from the package spine?

2. Flag surfaces that headline findings or dual create/review products.

3. Confirm buyer copy uses “architecture package” for finalized deliverables.

4. Do not mandate renaming every “Reviews” UI label — fix collapse patterns first.



## Claim boundary



Do not say findings or decisions are the hireable unit, or that create and review are two equal products. Say architecture package is primary; review is lifecycle; findings/decisions are children.



## Residual



**TB-1026** inventories nav-collapse surfaces. **TB-1027** aligns positioning and glossary pointers. Full vocab rewrite is out of scope.



## References



- [`TECH_BACKLOG.md`](../library/TECH_BACKLOG.md) — **TB-1026**/**TB-1027**, **M-176**/**M-177**

- [`UI_GLOSSARY_V1.md`](UI_GLOSSARY_V1.md)

- [`POSITIONING.md#create-vs-review--adversarial-evaluation-closed`](POSITIONING.md#create-vs-review--adversarial-evaluation-closed)

- [`BUYER_SECURITY_PROCUREMENT_PACKET.md#committed-golden-manifest-unit-of-truth-m-155`](BUYER_SECURITY_PROCUREMENT_PACKET.md#committed-golden-manifest-unit-of-truth-m-155) (`COMMITTED_GOLDEN_MANIFEST_UNIT_OF_TRUTH_PA_ONE_PAGER.md` alias)


