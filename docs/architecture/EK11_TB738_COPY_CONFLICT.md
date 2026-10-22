> **Scope:** EK-11 copy inventory. Internal engineering only. Does not authorize a half-rename of help or OpenAPI types.

# EK-11 / TB-738 copy conflict

Owner chose **Option K** (two kernels; ADR 0068 standing). Customer nouns:

| Persistence object | Origin / table | Customer noun |
|--------------------|----------------|---------------|
| `dbo.Runs` with `PackageOrigin = Reviewed` | review-led intake | **review** |
| `DraftRequests` | synthesis draft | **architecture** (draft; not a sealed record) |
| `dbo.Runs` with `PackageOrigin = Created` that is not sealed | synthesis generate | **architecture** (unsealed output) |

`PackageOrigin` remains a **field** on the run header, not a second object. ADR 0067 co-equal CTAs are unchanged.

## What already shipped

**TB-738** already unified the reviews hub H1 and nav to **Reviews**. The Vitest guard is `archlucid-ui/src/lib/review-terminology-guard.test.ts` (with `RUNS_LIST_PAGE_TITLES` buyer-polished and full-operator both `"Reviews"`). Do **not** delete that guard.

## What this prompt does not retitle

**TB-1400** still pins in-app help title **“Architecture packages”** via `REVIEW_PACKAGES_HELP_PAGE_TITLE` and `archlucid-ui/src/lib/review-packages-help-title-honesty.test.ts`. Retitling help to “Reviews” (or splitting help into review vs created-architecture) is an **owner override**. This prompt does not ship a half-rename that would fight TB-738 or TB-1400.

## Inventory (no mass rename)

| Surface | Current copy | Action |
|---------|--------------|--------|
| `/architecture/reviews` hub H1 / nav | Reviews (TB-738) | Keep |
| Reviews list page titles (`RUNS_LIST_PAGE_TITLES`) | Reviews | Keep |
| Help topic `review-packages` | Architecture packages (TB-1400) | Keep until owner override |
| OpenAPI / `ArchitectureRun` | wire type unchanged | Keep (no contract ADR) |
| `PackageOrigin` | Created / Reviewed field | Keep |

No single hub/list/detail page was found that still labels the same `dbo.Runs` row with four colliding nouns on one chrome stack. Detail eyebrows use “Architecture review”; hub uses “Reviews”; help remains “Architecture packages” by TB-1400.

## Decision

Document the conflict; do not delete TB-738 or TB-1400 guards; do not retitle help in this change.
