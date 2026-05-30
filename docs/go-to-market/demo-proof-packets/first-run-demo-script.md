# First-run demo script (simulator)

> **Scope:** One narrow buyer scenario using **Simulator** execution — not a customer outcome claim.

## Scenario

Contoso Retail modernization — Azure SaaS readiness conversation.

## Steps

1. Seed demo data: `dotnet run --project ArchLucid.Cli -- seed-demo-data` (when enabled).
2. Open operator **Home** → complete Core Pilot checklist through commit.
3. Export proof shape: `dotnet run --project ArchLucid.Cli -- pilot proof-packet <demo-run-id> --out artifacts/demo-proof/`
4. Show static packet shape: [`azure-saas-readiness-demo-proof.md`](azure-saas-readiness-demo-proof.md)

## Expected narrative

- Findings reference policy packs and manifest provenance.
- Banner: **demo tenant — replace before publishing.**
- Structural execution mode: **Simulator** unless real-mode configured.

## Failure fallback

- Use static demo proof markdown (no live tenant).
- Never invent customer logos, savings percentages, or reference names.
