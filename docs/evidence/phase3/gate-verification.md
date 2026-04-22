> **Scope:** Phase 3 exit-gate verification snapshot referenced from [ADR 0022](../../adr/0022-coordinator-phase3-deferred.md) and historical [`CHANGELOG.md`](../../CHANGELOG.md) entries.

# Phase 3 gate verification (historical snapshot)

This document anchors **mechanical verification** notes for ADR 0021 Phase 3 exit gates when [ADR 0022](../../adr/0022-coordinator-phase3-deferred.md) recorded blocked or deferred state.

## Path note

Checked-in narrative evidence for Phase 3 lives under **`docs/evidence/phase3/`**. Do not move these files to **`docs/artifacts/`** — the repository `.gitignore` entry **`artifacts/`** matches that folder name anywhere in the tree, so CI would never see the files and `scripts/ci/check_doc_links.py` would fail on every run.

## Current posture (2026-04-22 onward)

Strangler work is re-scoped under [ADR 0030](../../adr/0030-coordinator-authority-pipeline-unification.md); pre-release waivers for gates **(i)** and **(iv)** are recorded in [ADR 0029](../../adr/0029-coordinator-strangler-acceleration-2026-05-15.md). Use [`COORDINATOR_TO_AUTHORITY_PARITY.md`](../../runbooks/COORDINATOR_TO_AUTHORITY_PARITY.md) for the live gate table and [`pr-a2-cohort-parity.md`](pr-a2-cohort-parity.md) for PR A2 cohort evidence.

## Why this file remains

Older changelog and ADR prose link here; keeping the path stable avoids churn in `check_doc_links` and preserves audit trail for “what was verified when Phase 3 was still framed as a single PR A.”
