# Operator home guided review persistence

Verified behavior for the homepage **Run guided review** example (`/architecture/reviews/new?template=claims-intake-modernization`).

## Summary

The guided review example is **not persistent on click**. It opens review intake with prefilled sample fields only.

## What happens on click

1. The CTA navigates to `/architecture/reviews/new?template=claims-intake-modernization`.
2. The intake wizard resolves the template and prefills description and system name.
3. A callout explains that sample values were applied.
4. **No review record is created** until the user completes intake and submits (draft create → admit → run create), matching `SocraticIntakeWizard.test.tsx` ("without auto-submitting").

## Persistence model (after submit)

| Concern | Behavior |
| --- | --- |
| Saved review record | Yes — only after successful intake submit / run creation |
| Temporary session | Intake form state only until submit |
| Active workspace | Yes — created runs belong to the caller's scoped workspace |
| Dedicated sample workspace | No |
| Appears in Recent reviews | Yes — after a real run is created (not from the homepage link alone) |
| AI budget | Consumed only when pipeline execution runs after run creation |
| Resumable | Yes — via normal review detail / intake draft flows after partial progress |
| Duplicate creation | Each completed submit can create a new run; homepage link does not dedupe |
| Reporting | Counts as normal workspace activity once persisted; not marked sample unless `isSample` / seed flags apply |

## Homepage copy alignment

Homepage secondary example copy states that progress is saved **after submit**, not when opening the template link.

## Sample-data marking

Runs created from the template are not automatically marked `isSample` unless seeded or flagged by bootstrap. Do not treat the guided-review example as a curated homepage completed sample — that path uses workspace-owner **featured completed sample** configuration instead.

## Related surfaces

- **Explore a completed review** (hero) — workspace-owner-selected completed package (`GET/PUT /v1/tenant/homepage-settings`).
- **Architecture creation example** — static created-sample registry (distinct route).
- **Run guided review** — template prefill only until submit.
