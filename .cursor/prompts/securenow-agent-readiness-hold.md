# SN-AIR-HOLD — SecureNow AI/Agent Readiness stop list

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file only when a session starts building something this list forbids. This file is not a feature.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_AGENT_READINESS_COMPOSER_PROMPTS.md`

## Stop

Do not build any of the following while implementing SN-AIR prompts:

- An LLM re-rank, a second ranker, or a call from the explanation service or Ask to `PathRankingEngine`, `CutPointAnalysisEngine`, or `SecurityEvidencePathRankCalculator`.
- A change to path-rank weights or to `SecurityEvidencePathRankExplanationBuilder` prose.
- A `probability`, `likelihood`, or `sortScore` field on the explanation JSON or the Ask JSON.
- A numeric likelihood, confidence percent, or `%` chance in the explanation or the `RankedPath` answer.
- A second completion call after validation fails. The fallback is `BuildSimulatorExplanation` once.
- Deleting the simulator path. Real mode may call the model. Simulator mode, a still-loading mode, and a rejected model output still show the stored-path summary.
- A new LLM provider, or a concrete non-Azure provider. ADR 0020 stays in force.
- Reopening **TB-178** (streaming Ask) or **TB-180**–**TB-195** (calibrated confidence, nightly eval cron, readiness script, findings re-ranker, governance explainer, per-finding explainer, run summary, request authoring, IaC stubs, policy-pack drafting, LLM-as-judge, prompt hash, evidence summarization, provider factory, RAG health, multi-turn compression). Those rows are Done on the agent pipeline.
- Raising `AskEvidenceRowCap` above 50.
- Performing the **M-313** owner walk, or writing that a walk happened.
- Autonomous remediation, an Azure write, or copy that says SecureNow changes Azure.
- A new mailbox. Intake stays `support@archlucid.net`.
- A public price, a `$`, a Stripe link, or a "Start trial" control.
- A beta GO, or a checked box on `CONTROLLED_PILOT_OFFER.md`.
- A sidebar item that hides an existing review workspace tab behind More.
- Setting `continue-on-error` to false on the agent-readiness checker.
- More than one SN-AIR prompt in the same session.

If the session is about to do one of these, stop and report which line it hit.
