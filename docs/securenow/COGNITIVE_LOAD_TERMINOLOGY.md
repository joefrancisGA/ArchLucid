> **Scope:** SecureNow first-review terminology. Internal operator aid. It does not change API contracts, route segments, or persisted fields. Beta remains **NO_GO**.

# SecureNow cognitive-load terminology

Use these nouns consistently when describing the first review. State labels remain honest when evidence is missing, stale, blocked, or **NOT VERIFIED**.

| Canonical noun | Meaning | Surfaces |
|---|---|---|
| `capture` | A collected environment result with a freshness and collection status. | SecureNow Home, cloud connections, first hour |
| `ranked path` | A permission and network combination that SecureNow can cite and rank. It is not proof of an exploit. | Priorities & waves, first hour |
| `Path inspect` | The panel for the selected ranked row. It shows cited hops, weakest-hop limits, rank prose, and cut points. | Priorities & waves, first hour |
| `cut point` | An advisory recommendation for where a reviewer could intervene. SecureNow does not change Azure. | Path inspect, first hour |
| `question` | An infrastructure or review question that still needs a human answer. | Question queue, infrastructure diagrams |
| `verification` | A later capture or postcondition check that can confirm or reject a condition. | Remediation tracker, first hour |
| `sponsor packaging` | The reviewed evidence and decision material prepared for sponsor discussion after the review question is named. | First hour, pilot decision preparation |

## State language

- Missing or stale capture: a gap, not a clean bill of health.
- Blank ranking: not proof that the environment is secure.
- Missing later capture or postcondition: **NOT VERIFIED**.
- SecureNow recommendation: advisory; an external change still follows the organization's process.
