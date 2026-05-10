> **Scope:** Buyer-safe **demo recording** script (≈3 minutes) with explicit UI targets.

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md) — marketing operators may start at **[DEMO_QUICKSTART.md](../go-to-market/DEMO_QUICKSTART.md)**.

# Demo recording storyboard

**Audience:** Marketing, solutions engineers, and founders capturing a **polished** operator UI walkthrough.

**Last reviewed:** 2026-05-10

---

## Before capture

1. Use a **staging** workspace with **[Simulator](../library/V1_SCOPE.md)** mode or curated fixtures — never live production secrets in the recording.
2. Set **`NEXT_PUBLIC_*` demo flags** per **[DEMO_QUICKSTART.md](../go-to-market/DEMO_QUICKSTART.md)** and confirm **[operator-shell.md](operator-shell.md)** progressive disclosure matches the narrative (Pilot vs Operate).
3. Run **`scripts/demo-setup.ps1`** locally to validate API reachability, version endpoint, and optional SQL smoke prerequisites (see script header).

---

## Timeline (~3:00)

| Time | Voiceover (suggested) | On-screen action |
|------|----------------------|------------------|
| 0:00–0:20 | “ArchLucid turns architecture reviews into governed, exportable evidence.” | Landing / shell load; **[Search ⌘K](operator-shell.md)** appears — show **Documentation** entries opening trust / CORE_PILOT docs in a new tab. |
| 0:20–0:55 | “We start from an architecture request — the same object every stakeholder sees later.” | **New request** wizard: minimal happy path fields, submit. |
| 0:55–1:35 | “Agents run as a pipeline; severity and findings are structured, not a prose thread.” | Open **Reviews** → run detail → **Pipeline** / timeline; highlight one **finding** row. |
| 1:35–2:15 | “Finalizing yields a manifest you can defend in audits.” | **Commit / finalize** (if enabled in environment); open **Manifest** summary. |
| 2:15–2:45 | “Exports and compare/replay close the loop for drift.” | Show **Exports** or **Compare** entry from nav (scope-permitting); mention **audit CSV** availability for buyers ([AUDIT_COVERAGE_MATRIX.md](AUDIT_COVERAGE_MATRIX.md)). |
| 2:45–3:00 | “Deferred scope is documented openly — we do not oversell roadmap as GA.” | Flash **[V1_SCOPE.md](V1_SCOPE.md)** or **Trust Center** doc in Help/Docs search. |

---

## Capture tips

- Record **1080p**, hide personal bookmarks bar, use a **dark-or-light** theme consistently.
- Prefer **stage verbs** (“here is how a team would…”) over absolute availability claims unless **[V1_SCOPE.md](V1_SCOPE.md)** backs them.
- If a feature is behind Execute authority, narrate **RBAC** honestly — cite **[SECURITY.md](SECURITY.md)**.

---

## Related

- **[DEMO_QUICKSTART.md](../go-to-market/DEMO_QUICKSTART.md)** — environment wiring.
- **[RELEASE_SMOKE.md](RELEASE_SMOKE.md)** — CI-aligned check list after infra changes.
