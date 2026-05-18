> **Scope:** Buyer-first 30 minutes — GitHub-facing stub (no install); mirrors intent of `archlucid.net/get-started`; not contributor toolchain onboarding.
> **Audience banner:** Evaluators and sponsors arriving from GitHub or a forwarded link. For engineers cloning the repo, use `docs/engineering/FIRST_30_MINUTES.md` instead.

# Buyer — your first 30 minutes with ArchLucid

ArchLucid is a SaaS product. You will not install anything to evaluate it.

You found ArchLucid on GitHub. The repository is open so engineers can read the source, the architecture decisions, and the security posture before talking to us. Evaluating the product itself happens on the hosted SaaS at archlucid.net — there is no Docker, SQL, .NET, Node, Terraform, or CLI on the buyer path.

For the same five steps with screenshots and links, open archlucid.net/get-started.

Five steps. Roughly thirty minutes end-to-end on a normal connection.

1. **Sign in.** Open archlucid.net and sign in with your work identity (Microsoft Entra ID or a Google Workspace account). The sign-in flow uses your existing identity provider — there is no separate account to create and no credit card is required to start. You will land on a clean workspace ready for your first **architecture review**.
2. **Pick a vertical.** A short picker asks which industry profile to start from. The defaults match the briefs in templates/briefs/ — financial-services, healthcare, public-sector, public-sector-us, retail, saas. Choose the closest match; you can change it later. The vertical sets default compliance rules, terminology, and analysis priorities so the first **review** produces findings relevant to your domain. You are not locked in — the vertical can be changed at any time, and you can evaluate multiple verticals from the same workspace.
3. **Try a sample.** ArchLucid pre-populates a sample architecture request shaped for the vertical you picked, then runs the analysis pipeline. No upload required for the first **pass**. Within a few seconds the pipeline runs topology, cost, and compliance analysis against the sample request and produces a finalized manifest with structured findings and downloadable artifacts. You do not need to prepare any inputs or upload any files for this first pass — the goal is to see the shape of the output before investing your own data.
4. **Read your first finding.** Open the finalized **review** and read the first typed finding — what was flagged, why it was flagged, what evidence backs it. This is the smallest unit of value the product produces. Each finding carries a category (topology, cost, compliance, or quality), a severity level, a plain-language explanation of why it matters, and the evidence the analysis used to reach the conclusion. This is how ArchLucid communicates reviewable, defensible architecture observations — structured enough to act on, transparent enough to challenge.
5. **Decide what to do next.** Either invite a colleague and run a second sample, or hand off to a guided pilot. If you want a second opinion, invite a colleague to sign in and run the same sample or a different vertical — no configuration is needed, and they will see results in their own workspace within minutes. If you are ready to move beyond the sample, the guided pilot path in docs/CORE_PILOT.md walks through creating a request with your own inputs, committing a manifest, and reviewing the artifacts that a real pilot would produce.

Nothing on this page asks you to install Docker, SQL Server, .NET, Node, Terraform, or a CLI. If a document tells you to install one of those, you are reading contributor material — engineering docs that live under docs/engineering/ for ArchLucid contributors only.

## Where to go next

- Screenshots and the same five steps with the live UI: archlucid.net/get-started.
- Operator path (after the sample **review**, when you are ready for a real pilot): docs/CORE_PILOT.md.
- What the product is and is not, in plain language: docs/EXECUTIVE_SPONSOR_BRIEF.md.
- Pricing: archlucid.net/pricing.
