> **Scope:** Paste-ready GPT-5.6 Luna prompts for the SecureNow remediation verification honesty fix. Internal engineering only. Prompts only — do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/securenow-verification-00-index.md`](../../.cursor/prompts/securenow-verification-00-index.md)

# SecureNow verification honesty — Luna prompts

**Created:** 2026-09-28 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

**Source:** the source-checked response in [`../securenow/OPENAI_ASTRA_SGS_REVIEW_2026-09-27_AND_RESPONSE.md`](../securenow/OPENAI_ASTRA_SGS_REVIEW_2026-09-27_AND_RESPONSE.md). That response is the settled reading. These prompts implement its "act now" list only.

Paste **one** prompt per Luna session. Run them in order. Do not implement from this index.

| ID | Prompt | Depends on | Intent |
|----|--------|------------|--------|
| **SN-VF-01** | [securenow-verification-01-chronology-and-capture.md](../../.cursor/prompts/securenow-verification-01-chronology-and-capture.md) | — | Verification snapshot must be `Succeeded` and strictly later than the execution snapshot |
| **SN-VF-02** | [securenow-verification-02-path-analysis-complete.md](../../.cursor/prompts/securenow-verification-02-path-analysis-complete.md) | SN-VF-01 | `path:hash-absent=` fails when path analysis did not complete |
| **SN-VF-03** | [securenow-verification-03-substantive-postcondition.md](../../.cursor/prompts/securenow-verification-03-substantive-postcondition.md) | SN-VF-02 | `Verified` requires a substantive postcondition |
| **SN-VF-04** | [securenow-verification-04-change-implemented.md](../../.cursor/prompts/securenow-verification-04-change-implemented.md) | SN-VF-03 | Attested `ChangeImplemented` between advisory execute and verify |
| **SN-VF-05** | [securenow-verification-05-workbench-labels.md](../../.cursor/prompts/securenow-verification-05-workbench-labels.md) | SN-VF-04 | Workbench labels and the Close affordance match the server |

## Do not pull into these sessions

- VNet diagram semantics
- Entra, PIM, Conditional Access, or MFA collectors
- Defender positioning copy, or a new Defender attack-path engine
- Recovery, backup, or restore-test evidence
- **TB-2409** stable-conclusion seal gate
- Splitting API and Worker
- Azure apply, or turning `ExecuteAsync` into anything other than advisory
