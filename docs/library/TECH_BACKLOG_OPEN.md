> **Scope:** Contributor-reference — verified open items extracted from the main tech backlog; not a buyer or operator document.

# Tech backlog — verified open items

> **Updated:** 2026-06-01. **Source of truth:** [`TECH_BACKLOG.md`](TECH_BACKLOG.md).

## Recently closed (do not re-open)

| Cluster | IDs |
| --- | --- |
| Cross-tenant isolation test matrix | **TB-078** |
| Architecture.Tests gap closure | **TB-030** |
| Backfill / jobs operational hardening | **TB-085** – **TB-090** |
| Tenancy defense-in-depth | **TB-076**, **TB-077** |
| In-app docs | **TB-143 – TB-148** |
| Data consistency KPIs | **TB-149 – TB-155** |
| Local dev diagnostics | **TB-156 – TB-157** |
| Run detail operator fidelity | **TB-109 – TB-113** (incl. **TB-110** tool forensics) |
| Starter proof packs | **TB-170 – TB-174** (chooser, metadata, CI validation, dry-run, golden walkthrough) |
| Policy pack manifests | **TB-175 – TB-176** (packManifest, CI validation, dry-run index) |
| Commercial / audit parity | **TB-121 – TB-128** (route parity, governance summary, freshness, audit matrix, buyer-safe audit, catalog, tests, triage one-pager) |
| Commercial closeout | **TB-129 – TB-134** (quote-to-proof readiness, quote aging export, closeout consistency, tier fit, offer pack, overclaim guard) |
| Pilot acceptance automation | **TB-158** (threshold doc + `report_pilot_acceptance_thresholds.py` + first-pilot proof artifacts) |

## P1 — security / tenancy (next engineering batch)

_(None — TB-071–TB-078 closed; see architecture stragglers below.)_

## Real-mode / eval (owner or credentialed CI)

| ID | Title |
| --- | --- |
| TB-140 | Real-mode eval corpus (all `simulator` today) |
| TB-139 | Token usage in gate metrics (partial) |
| TB-137 | Quad-agent live pipeline (owner re-run evidence) |

## Architecture / provenance / determinism stragglers

| ID | Title |
| --- | --- |
| TB-011 | Invariant Wave B remainder (persisted gate read path, dual-replica budget CI harness) |
| TB-012 | Invariant Wave C |
| TB-034 – TB-038, TB-040, TB-044 – TB-056 | Provenance / determinism / explainability gaps |

## Docs hygiene

| ID | Title |
| --- | --- |
| TB-170 (docs) | Markdown link integrity CI — stale relative links (warn-only) |

## GTM / owner-blocked

**TB-141**, **TB-142**, **TB-135/136** (V1.1), **G-REAL-01–04**.
