> **Scope:** One-page buyer routing — answers "Is ArchLucid right for me?" in under 2 minutes; not a substitute for the executive sponsor brief or pilot guide.

# Should you evaluate ArchLucid?

Work through the questions in order.

## Decision tree

**Q1.** Does your team produce architecture review packages for stakeholders?

- **No** → ArchLucid may not be a fit today. See [go-to-market/NOT_A_FIT.md](NOT_A_FIT.md).
- **Yes** → Continue.

**Q2.** Do you run workloads on Azure (or plan to within 6 months)?

- **No** → ArchLucid V1 targets Azure workloads. Contact us for multi-cloud roadmap.
- **Yes** → Continue.

**Q3.** Do you spend 20+ hours per architecture review cycle?

- **No** → You may still benefit from governance and compliance features. Start with a quick scan.
- **Yes** → Strong fit — proceed to evaluation.

**Q4.** Do you need governance, audit trails, or compliance evidence from architecture reviews?

- **Yes** → Start with the Operate layer evaluation.
- **No** → Start with the Pilot layer — request → commit → review.

## 15-minute evaluation path

**Hosted SaaS:** Sign up at [archlucid.net](https://archlucid.net) → quick scan → review findings → commit manifest (about 15 minutes).

**Self-hosted:** From the repo root run `dotnet run --project ArchLucid.Cli -- try` → review the output → decide on a longer pilot (about 15 minutes).

## Next reads

- [Executive Sponsor Brief](EXECUTIVE_SPONSOR_BRIEF.md)
- [Pricing philosophy](PRICING_PHILOSOPHY.md)
- [Trust Center](trust-center.md)
- [Core Pilot guide](../CORE_PILOT.md)
