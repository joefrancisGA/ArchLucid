<!-- SecureNow verification honesty — Luna prompts.
     Origin: 2026-09-28 owner ask, after the source-checked response to the
     OpenAI Astra SGS review. Do not implement from this index. -->

# SecureNow verification honesty — Luna prompt set (SN-VF-01–SN-VF-05)

`Verified` must mean the evidence supports the claim. Paste **one** numbered file per GPT-5.6 Luna session, in order.

Copy-paste docs index: [`docs/architecture/SECURENOW_VERIFICATION_HONESTY_LUNA_PROMPTS.md`](../../docs/architecture/SECURENOW_VERIFICATION_HONESTY_LUNA_PROMPTS.md).

Settled reading: [`docs/securenow/OPENAI_ASTRA_SGS_REVIEW_2026-09-27_AND_RESPONSE.md`](../../docs/securenow/OPENAI_ASTRA_SGS_REVIEW_2026-09-27_AND_RESPONSE.md). If a prompt and that response conflict on the five verification rules, **the response wins**.

| # | Prompt | What moves |
|---|--------|------------|
| 1 | **SN-VF-01** | Chronology via `CapturedUtc`; refuse anything other than `Succeeded` |
| 2 | **SN-VF-02** | Empty path list is not proof the path is gone |
| 3 | **SN-VF-03** | Empty queries, or `snapshot.resource.present` alone, cannot pass |
| 4 | **SN-VF-04** | Human-attested `ChangeImplemented` before verify |
| 5 | **SN-VF-05** | Advisory generated / change implemented / change verified, and Close only after `Verified` |
