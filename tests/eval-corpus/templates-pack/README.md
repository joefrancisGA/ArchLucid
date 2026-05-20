# Templates-pack eval harness

**Purpose:** Structured agent-output evaluation harness keyed to the curated
`templates/architecture-requests/*.json` payloads. Detects regressions between
prompt or model changes by re-running 10 canonical inputs and scoring the
resulting findings against expected/unexpected rules.

**Lifecycle:**

1. **Capture (one-off per recording refresh):** Run
   `scripts/ci/eval_template_harness.py --mode capture --base-url <api>` against
   a live ArchLucid API. The script POSTs each template, polls for
   `ReadyForCommit`, commits, and saves the findings to
   `recordings/<scenario-id>.findings.json`.
2. **Score (every CI run after capture):**
   `scripts/ci/eval_template_harness.py --mode score` loads the committed
   recordings and applies the `expectedFindings` / `unexpectedFindings` rules
   from each `scenario-NN-*.json`, honoring `rubric.json` thresholds.
3. **Iterate:** Once you see the first inform-only score report, edit the
   scenarios to match the agents' actual vocabulary, or fix the prompts to
   match the scenarios. Flip the workflow from `--mode score` (inform) to
   `--mode score --enforce` once a stable baseline exists.

**Why a separate folder from the main `tests/eval-corpus/`:** The existing
corpus uses pre-frozen recordings authored by hand to score specific behaviours
(adversarial cases, simulator/real-mode quality gates). This pack uses
live-captured recordings to track end-to-end behaviour on the 10 buyer-shaped
templates. Keeping it isolated avoids muddling the two intents and lets you
delete or regenerate the whole pack without touching the manifest the existing
release-candidate workflow scores against.

**Files:**

| Path | Role |
|------|------|
| `rubric.json` | R1-R6 scoring policy (recall floor, severity rule, etc.) |
| `scenario-NN-*.json` | 10 scenarios, one per chosen template |
| `recordings/` | Committed live-capture outputs (populated by `--mode capture`) |
| `scripts/ci/eval_template_harness.py` | Runner with capture + score modes |
| `.github/workflows/template-eval-harness.yml` | Workflow-dispatch, inform-only initially |

**First-run guidance:**

The expected findings in each scenario are a **v0 hypothesis** by the assistant
who drafted them, not ground truth. Run capture once against a stable API, look
at the first score report, then tune the `evidenceMustContain` anchors to match
the agents' actual wording. Do not flip the workflow to `--enforce` until the
score report shows zero unexpected hits and recall consistently passes R1.

**Matching rules (rubric.json):**

- `recallFloorPct`: percentage of MUST themes that must be hit per case.
- `unexpectedHitMax`: max allowed unexpected-list hits across the whole pack.
- `negationGuardEnabled`: when true, an `evidenceMustContain` substring match
  is rejected if a negation word (`no`, `not`, `without`, `avoid`, `deny`,
  `disable`, `skip`, `bypass`) appears within 5 tokens before the anchor. This
  prevents false-greens on outputs like "do not use key vault".
- `severityRule`: `gte` means `minimumSeverity` is satisfied when the actual
  finding severity is greater than or equal to the rule.
- `mode`: `simulator` by default — flip to `real` only when capturing against
  Azure OpenAI.
