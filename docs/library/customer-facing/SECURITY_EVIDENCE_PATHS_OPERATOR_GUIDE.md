# Security evidence paths (SecureNow)

Read architect paths in the **Path inspect** panel on the remediation factory priority queue, on the SecureNow **Findings** queue (`/compliance/findings`), and on **Assigned to me** (`/security/assigned-to-me`). Select one finding row (or open a link with `findingId` in the address bar), then press **Alt+I** (Focus path inspect) to scroll to the panel.

## What the panel shows

- **Confidence band** as a word label (Confirmed, Highly likely, Probable, Possible, Insufficient evidence) — not a percentage.
- **Architect path summary** — a deterministic sentence built from cited hops, weakest link, cut points, and verification hints.
- **Weakest hop** callout with provenance and band.
- **Cut points** and **organizational routing** when present on the path record.

## Honesty rules

SecureNow describes **configuration paths**, not observed traffic or auditor conclusions.

- Capability-to-flow paths use **may access** / **may reach** language.
- Missing network hops are omitted from the sentence instead of inventing a network segment.
- The desk does not claim data exfiltration, compliance attestation, or live **apply to Azure** actions from this panel.

## Attack path report

On [Priorities & waves](/security/remediation-factory), the **Attack path report** sits above the priority queue for the selected inventory snapshot.

- **Vulnerable attack paths** lists privilege, can reach (intended reachability), and toxic-combination paths whose band is Confirmed, Highly likely, or Probable.
- **Could not be fully evaluated** lists insufficient evidence paths (grouped by the recorded gap), control-plane paths with no observed traffic, and rows where path search stopped at a cap. The reason on each row is the limit of the evidence, not a finding that the path is safe.
- Capability paths (may access), shared-control blast radius, and four-reality drift stay on the ranked architect paths table below the report.

The report does not claim exploitability, observed traffic, or a percentage.

## Highest-leverage cut points

On the same page, **Highest-leverage cut points** lists SA-10 choke points for the current ranked paths (up to ten). Each row explains how many ranked paths would collapse if that node or edge were removed, and may suggest an approved remediation pattern when exactly one match exists.

Use **Highlight path** to select a collapsed path and open **Path inspect** for hop evidence. Cut points are advisory; nothing applies to Azure from this page.

## Executive remediation metrics

On [Priorities & waves](/security/remediation-factory), the **Executive remediation metrics** grid summarizes open operational security findings in the current workspace. Each tile shows a count or share with a short helper that describes what is in scope.

## How these counts are measured {#how-these-counts-are-measured}

Open findings uses the factory metrics count. The governance queue can count open rows differently. Risk-weighted open uses remediation prioritization rule IE15-priority-v1. Net burn is opened minus closed. It is not cloud spend.

## Architect outcome metrics (SA-11) {#architect-outcome-metrics}

Rule version **SA11-metrics-v1**.

Select an earlier **From snapshot** and a later **To snapshot**, then press **Compare snapshots**. Headline deltas describe architecture outcomes — path removal and posture change — not ticket burn-down. Ordinal bands only; no percentage confidence on these cards.

| Headline metric | What changed between snapshots |
| --- | --- |
| Critical/high paths removed | Paths in the earlier snapshot with confidence band Confirmed or Highly likely whose canonical path fingerprint is absent in the later snapshot |
| Privileged identity nodes reduced | Non-negative drop in distinct managed-identity nodes referenced on paths |
| Unrestricted egress paths reduced | Capability-to-flow paths with unrestricted egress in the earlier snapshot whose fingerprint is absent in the later snapshot |
| Crown jewel exposure paths removed | Paths linked to a crown jewel assertion in the earlier snapshot whose fingerprint is absent in the later snapshot |

A path is **removed** when its canonical path fingerprint exists in the earlier snapshot set and is missing from the later set. Band improvement alone does not count as removal.

**Supporting: open findings** is operational context on the panel, not a headline architecture outcome.

## Where to go next

- Open an **advisory remediation instance** from the panel when one exists for the selected finding.
- Use cut-point summaries to prioritize one choke-point change instead of remediating every hop independently.

## Related

- Path inspect workbench: `docs/library/SECURENOW_PATH_INSPECT_WORKBENCH.md`
- Cut points: `docs/library/SECURENOW_CUT_POINTS.md`
