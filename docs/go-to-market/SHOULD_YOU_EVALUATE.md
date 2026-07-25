> **Reviewed:** 2026-07-25

> **Scope:** One-page buyer routing — answers "Is ArchLucid right for me?" in under 2 minutes, plus the blunt not-a-fit filter; not a substitute for the executive sponsor brief or pilot guide.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Should you evaluate ArchLucid?

**Last reviewed:** 2026-07-25

Work through the questions in order.

## Decision tree

**Q1.** Does your team produce architecture packages for stakeholders?

- **No** → ArchLucid may not be a fit today. See [When ArchLucid is not a fit](#when-archlucid-is-not-a-fit).
- **Yes** → Continue.

**Q2.** Do you run workloads on Azure (or plan to within 6 months)?

- **No** → ArchLucid V1 targets Azure workloads. If your workloads are on AWS or GCP, [contact us](https://archlucid.net/contact) about our multi-cloud roadmap.
- **Yes** → Continue.

**Q3.** Do you spend 20+ hours per architecture review cycle?

- **No** → You may still benefit from governance and compliance features. Start with a quick scan.
- **Yes** → Strong fit — proceed to evaluation.

**Q4.** Do you need governance, audit trails, or compliance evidence from architecture reviews?

- **Yes** → [Start with the Operate layer evaluation](/governance).
- **No** → [Start with Pilot (pre-fills greenfield preset)](/reviews/new?preset=greenfield) — request → commit → review.

**Q5.** Does your team have at least 3 architects or engineers who regularly author architecture decisions?

- **No** → ArchLucid may be early — try a single pilot review to validate fit.
- **Yes** → You are well-positioned for a full pilot.

## 15-minute evaluation path

**Hosted SaaS:** Sign up at [archlucid.net/trial](https://archlucid.net/trial) → quick scan → review findings → commit manifest.

If sign-up is not yet available, [request a guided demo](https://archlucid.net/contact).

**Self-hosted:** From the repo root: `archlucid doctor && archlucid new --quick-scan` → review findings (about 15 minutes).

## Strong fit signals

You are likely a strong fit if:

- Your last architecture review involved ≥2 weeks of preparation time
- You have had a compliance finding surface in production rather than during design
- You are Azure-primary or planning to be within 6 months
- Your organization has a formal architecture review board or CAB
- You need to produce audit-trail evidence for a regulator, insurer, or CTO sign-off

## When ArchLucid is not a fit

Blunt filter — save buyers and our team time. Disqualify early; do **not** promise roadmap to close bad-fit deals.

### Product / scope

- Teams that **only** need **diagrams** or **wiki pages** with **no** intention to adopt a **manifest-led** workflow.
- Organizations that **cannot** use **Azure** (hosting, identity, or data residency) for a pilot **and** will not accept a **bring-your-own-Azure** model aligned to [`FIRST_AZURE_DEPLOYMENT.md`](../library/FIRST_AZURE_DEPLOYMENT.md).
- Buyers expecting **100% automated compliance sign-off** — ArchLucid produces **evidence and structured outputs**; **human accountability** remains (see [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md)).

### Security / compliance posture

- **Unacceptable** tenant isolation (e.g. refusing scoped credentials, shared “god” SQL logins for all tenants in SaaS patterns).
- Requirements for **on-prem only** without a **documented** equivalent deployment story (fork must own **all** operational burden).
- **Mandatory SMB/SMB-on-internet** for primary artifacts — conflicts with product security stance (use private endpoints).

### Commercial / maturity

- **No named sponsor** and **no success metrics** for a pilot — success cannot be reviewed.
- Expectation of **full production HA** on **minimal pilot** budget — start with [`PILOT_PROFILE.md`](../deployment/PILOT_PROFILE.md) *or* align spend before enterprise HA ([`REFERENCE_SAAS_STACK_ORDER.md`](../library/REFERENCE_SAAS_STACK_ORDER.md)).
- Demands for **features outside V1** without acceptance of [`V1_SCOPE.md`](../library/V1_SCOPE.md) and [`V1_DEFERRED.md`](../library/V1_DEFERRED.md).

### When to re-open the conversation

- Sponsor assigned; **Core Pilot** metrics agreed (time-to-manifest, traceability, optional governance).
- Azure subscription + identity path accepted; security review **scheduled**, not vague “later”.

## Next reads

- [Executive Sponsor Brief](EXECUTIVE_SPONSOR_BRIEF.md)
- [Buyer personas + ICP](BUYER_PERSONAS.md#ideal-customer-profile-icp)
- [Pricing philosophy](PRICING_PHILOSOPHY.md)
- [Trust Center](trust-center.md)
- [Core Pilot guide](../CORE_PILOT.md)
