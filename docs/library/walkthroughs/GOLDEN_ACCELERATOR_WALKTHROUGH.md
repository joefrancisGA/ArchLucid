> **Scope:** One canonical accelerator walkthrough — regulated SaaS procurement pack (TB-118).

# Golden accelerator walkthrough — regulated SaaS procurement

Use **after** Core Pilot first commit. Fictional names only.

## Prerequisites

- Committed Core Pilot review completed ([`CORE_PILOT.md`](../../CORE_PILOT.md))
- Pack: [`templates/starter-proof-packs/regulated-saas-soc-procurement/`](../../../templates/starter-proof-packs/regulated-saas-soc-procurement/)
- Chooser: [`templates/starter-proof-packs/STARTER_PROOF_PACK_CHOOSER.md`](../../../templates/starter-proof-packs/STARTER_PROOF_PACK_CHOOSER.md)

## Steps

1. **Choose pack** — Confirm buyer job matches SOC-style procurement language (not CPA attestation).
2. **Load second run** — Operator **New review → Starting point → SECOND_RUN** paste `second-run.json`, or `archlucid second-run templates/starter-proof-packs/regulated-saas-soc-procurement/second-run.json`.
3. **Attach policy context** — Use `policy-context.json` to select SaaS policy pack folder per pack README.
4. **Execute and commit** — Wait for **Ready for commit**, run optional governance dry-run, then **Finalize**.
5. **Review outputs** — Walk `proof-package-checklist.md`: findings, evidence labels, manifest id, artifacts table.
6. **Proof packet** — `archlucid pilot proof-packet <runId>` and/or `.\scripts\collect-first-pilot-proof.ps1 -RunId <runId> -SponsorHandoff`.
7. **Commercial next step** — Send proof folder + [`COMMERCIAL_DECISION_PACKET.md`](../../go-to-market/COMMERCIAL_DECISION_PACKET.md); review `quote-to-proof-readiness.json` / `commercial-closeout.md`.

## What good looks like

- Execution mode labeled (Real / Simulator / Mixed)
- ROI lines show source kind — not placeholder-only savings
- Limitations file states **no SOC 2 certification** implied
- Sponsor disposition **PASS** or explicit **HOLD** with caveats

## What not to promise

See [`WHAT_NOT_TO_PROMISE.md`](../../go-to-market/WHAT_NOT_TO_PROMISE.md).
