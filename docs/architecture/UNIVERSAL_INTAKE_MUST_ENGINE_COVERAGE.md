# Universal intake MUST → engine coverage (PC-02)

Maps each L0 MUST question to deterministic engines in `GoldenCorpusHarness.CreateEngines()`.

Harness registers **16** engines; no 40th coverage engine is added.

| MUST question key | Harness engines | In harness |
| --- | --- | --- |
| `l0.actor.additional-kinds` | `trust-boundary`, `external-exposure`, `privileged-access` | yes |
| `l0.pillar.reliability` | `topology-coverage`, `requirement-coverage` | yes |
| `l0.pillar.security` | `security-baseline`, `security-gap`, `security-coverage`, `trust-boundary` | yes |
| `l0.pillar.cost` | `cost-constraint` | yes |
| `l0.pillar.operations` | `compliance`, `declaration-security-baseline` | yes |
| `l0.pillar.performance` | `topology-coverage`, `requirement-coverage` | yes |
| `l0.pillar.sustainability` | `cost-constraint`, `topology-coverage` | yes |
| `l0.pillar.cloud-target` | `compliance`, `security-baseline` | yes |

Authoritative TypeScript source: `archlucid-ui/src/lib/intake/universal-intake-must-engine-coverage.ts`.
