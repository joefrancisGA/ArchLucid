> **Scope:** One-page buyer routing — answers "Is ArchLucid right for me?" in under 2 minutes; not a substitute for the executive sponsor brief or pilot guide.

# Should you evaluate ArchLucid?

Work through the questions in order.

## Decision tree

**Q1.** Does your team produce architecture packages for stakeholders?

- **No** → ArchLucid may not be a fit today. See [go-to-market/NOT_A_FIT.md](NOT_A_FIT.md).
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

## Next reads

- [Executive Sponsor Brief](EXECUTIVE_SPONSOR_BRIEF.md)
- [Pricing philosophy](PRICING_PHILOSOPHY.md)
- [Trust Center](trust-center.md)
- [Core Pilot guide](../CORE_PILOT.md)
