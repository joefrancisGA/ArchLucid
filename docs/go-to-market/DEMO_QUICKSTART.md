> **Scope:** ArchLucid demo quickstart (buyer-facing) - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# ArchLucid demo quickstart (buyer-facing)

**Audience:** Evaluators and champions who want to see the product in minutes without installing the .NET SDK, SQL Server, or Node.js locally.

**Grounding:** Same demo data as [demo-quickstart.md](../archive/onboarding/demo-quickstart.md) (Contoso Retail) and [V1_SCOPE.md](../library/V1_SCOPE.md). The Docker path uses **Development** environment, **simulator** agent mode (no Azure OpenAI charges), and **startup demo seed** after DbUp.

---

## Prerequisites

- **Docker Desktop** (Windows or macOS) or **Docker Engine** (Linux)
- That is all — no .NET 10 SDK, no local SQL Server, no Node.js for running the stack

---

## Start the demo (one command)

From the repository root:

| Platform | Command |
|----------|---------|
| **Windows (PowerShell)** | `.\scripts\demo-start.ps1` |
| **macOS / Linux (Bash)** | `./scripts/demo-start.sh` (ensure executable: `chmod +x scripts/demo-start.sh`) |
| **Manual** | `docker compose -f docker-compose.yml -f docker-compose.demo.yml --profile full-stack up -d --build` |

The script waits up to **120 seconds** for `http://localhost:5000/health/ready`, then opens the architect workspace (where supported).

**Ports used:** 1433 (SQL), 3000 (UI), 5000 (API), 10000–10002 (Azurite), 6379 (Redis). Free these before starting if something else is bound.

**API port note:** This Docker **full-stack** profile exposes the API on **5000** (see health URL above). When you run **`ArchLucid.Api`** directly from the repo (e.g. [`OPERATOR_QUICKSTART.md`](../library/customer-facing/OPERATOR_QUICKSTART.md)), the default local port is often **5128** — same product, different host binding; do not assume one URL works for both without checking your `launchSettings` / compose maps.

---

## Your first five minutes (finished-package-first)

**Do not open with `/reviews/new` or generation.** Trust ladder: show a **completed architecture package** first, then optionally bridge to creation.

1. **Open a finalized package** — From home or **Architecture packages** (`/reviews`), open the seeded **hardened Contoso** review (`6e8c4a102b1f4c9a9d3e10b2a4f0c502` after startup seed; see [demo-quickstart.md](../archive/onboarding/demo-quickstart.md) §3) or the static showcase **Claims Intake Modernization** package at `/reviews/claims-intake-modernization` when running UI-only fixtures. You should land on review detail with findings and manifest linkage already present.
2. **Findings and explainability** — Open one finding. Walk the structured trace (what was examined, rules applied, evidence cited, confidence limits). Call out an **explicit non-conclusion** or evidence gap when the finding flags missing proof — do not imply the AI always concludes.
3. **Finalize / architecture package** — Show the signed review record / architecture package summary (finding counts, decision trail). This is the sponsor-ready package, not a chat transcript.
4. **Export** — Download Markdown, DOCX, or ZIP from review detail or the export flow (consulting templates may require optional configuration).
5. **Creation bridge (one line)** — "Creation follows the same governed pipeline." Optional 30-second peek: home **Open created sample** → `/reviews/northwind-copilot-rag-platform` (**Created** origin badge; see **TB-742**). Do not start the five-minute path there.

**Optional if time remains:** **Compare** two Contoso reviews (`…c501` baseline vs `…c502` hardened) or **Graph** on the opened package. Save **New review** wizard for a longer principal-architect session ([`DEMO_VIDEO_SCRIPT.md`](DEMO_VIDEO_SCRIPT.md) §30-minute variant).

Adjust entry if you prefer the home dashboard at `http://localhost:3000/` — still open an existing package, not the wizard.

---

## What you are seeing

- **Architecture Proof Engine** — A multi-agent pipeline produces structured findings and a versioned golden manifest on **architecture packages** (reviewed or created); in simulator mode, agents run without calling cloud LLMs.
- **Governance and audit** — Policy packs, optional pre-commit gates, and durable audit patterns match [POSITIONING.md](POSITIONING.md) and [PRODUCT_DATASHEET.md](PRODUCT_DATASHEET.md).
- **Explainability** — Findings carry traces suitable for review and audit narratives.

For full capability claims, use [V1_SCOPE.md](../library/V1_SCOPE.md) and the [Product datasheet](PRODUCT_DATASHEET.md).

---

## Cleanup

| Platform | Command |
|----------|---------|
| **Windows** | `.\scripts\demo-stop.ps1` |
| **macOS / Linux** | `./scripts/demo-stop.sh` |

This runs `docker compose ... down -v` and removes named volumes (including Azurite data). SQL data in the compose setup is also discarded with `-v` as defined by the stack.

---

## Troubleshooting

- **Timeout on health/ready** — Run `docker compose -f docker-compose.yml -f docker-compose.demo.yml --profile full-stack logs api` and confirm SQL and Azurite are healthy.
- **Port conflicts** — Stop other services on 1433, 3000, or 5000, or adjust host port mappings in a **local** override (do not commit port changes unless your team standardizes them).

---

## Next steps

- **Production-style pilot:** [Pilot Guide](../library/customer-facing/PILOT_GUIDE.md)
- **Business case:** [ROI_MODEL.md](ROI_MODEL.md) and [PILOT_SUCCESS_SCORECARD.md](PILOT_SUCCESS_SCORECARD.md)
- **Developer / detailed demo seed:** [demo-quickstart.md](../archive/onboarding/demo-quickstart.md)
- **Hosted GA workspaces (anchors + Smoke):** [`DEMO_WORKSPACES.md`](DEMO_WORKSPACES.md)

---

## Related documents

| Doc | Use |
|-----|-----|
| [CONTAINERIZATION.md](../engineering/CONTAINERIZATION.md) | All Docker workflows including demo overlay |
| [demo-quickstart.md](../archive/onboarding/demo-quickstart.md) | Technical demo seed and HTTP verification |
