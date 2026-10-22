# ArchLucid Architecture-Generation Requirements Corpus

Five original, intentionally compact requirements briefs for exercising architecture generation. Each brief is designed to print at roughly 3–5 pages with ordinary document settings (11-point font, 1-inch margins); none exceeds the requested 10-page ceiling.

## What these examples test

| Brief | Primary architecture pressures |
|---|---|
| 01 | Regulated data, clinical integration, availability, auditability |
| 02 | Low latency, event throughput, model lifecycle, fraud operations |
| 03 | Multi-tenant isolation, B2B identity, data residency, self-service |
| 04 | Intermittent connectivity, edge/cloud split, safety, operations |
| 05 | Public-sector surge response, geospatial data, interoperability, continuity |

## Recommended use

Submit one brief at a time as an `ArchitectureRequest` description or `inlineRequirements`. Ask ArchLucid to return, at minimum:

1. A C4-style logical architecture with trust boundaries and data flows.
2. An explicit requirements-to-decisions traceability table.
3. Assumptions, contradictions, and unresolved questions; do not invent answers.
4. Security, reliability, performance, cost, operational, and sustainability findings with evidence state.
5. A prioritized implementation and validation backlog.

These briefs deliberately include a few bounded unknowns. A strong result should flag them as **INSUFFICIENT EVIDENCE** or assumptions, rather than silently deciding them.

## Input discipline

The documents distinguish:

- **Mandatory**: must be satisfied.
- **Preferred**: use unless a documented tradeoff makes another choice better.
- **Unknown / decision required**: do not treat as a requirement.
- **Out of scope**: prevent architecture creep.

All organizations, figures, and scenarios are fictional. No credentials, regulated records, or production configurations are included.
