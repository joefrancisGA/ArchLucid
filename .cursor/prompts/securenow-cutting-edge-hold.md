# SN-CE-HOLD — SecureNow cutting-edge stop list

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file only when a session starts building something this list forbids. This file is not a feature.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_CUTTING_EDGE_COMPOSER_PROMPTS.md`

## Stop

Do not build any of the following while implementing SN-CE prompts:

- An LLM re-rank, a second ranker, or a call from Ask to `PathRankingEngine`, `CutPointAnalysisEngine`, or `SecurityEvidencePathRankCalculator`.
- A change to path-rank weights or to `SecurityEvidencePathRankExplanationBuilder` prose.
- A `probability`, `likelihood`, or `sortScore` field on the Ask JSON. Quoting the stored `compositeSortScore` in an evidence line is allowed. Computing a new one is not.
- A numeric likelihood, confidence percent, or `%` chance in the `RankedPath` answer.
- Selecting `RankedPath` from keywords when `SecurityEvidencePathId` is absent.
- Replacing `buildSecurityEvidencePathExplanation` or the path-inspect explanation button. That button stays on the simulator.
- A new LLM provider, or a concrete non-Azure provider. ADR 0020 stays in force.
- Reopening **TB-178** (streaming Ask) or **TB-191**–**TB-195** (prompt hash, evidence summarization, provider factory, RAG health, multi-turn compression). Those rows are Done on the agent pipeline. This wave does not port them onto infrastructure Ask.
- Raising `AskEvidenceRowCap` above 50, or summarizing rows past that cap. Overflow summarization is a later increment.
- Autonomous remediation, an Azure write, or copy that says SecureNow changes Azure.
- A new mailbox. Intake stays `support@archlucid.net`.
- A public price, a `$`, a Stripe link, or a "Start trial" control.
- A beta GO, or a checked box on `CONTROLLED_PILOT_OFFER.md`.
- A sidebar item that hides an existing review workspace tab behind More.
- Setting `continue-on-error` to false on the cutting-edge checker.
- More than one SN-CE prompt in the same session.

If the session is about to do one of these, stop and report which line it hit.
