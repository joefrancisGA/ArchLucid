# EXW-05 — Classify the Defender attack-path failure

**Model:** Composer 2.5. Paste this file as the whole task. Do not implement EXW-06 in this session.

**Repo:** `c:\ArchLucid`

## Goal

Classify this package warning and stop:

`defender-attack-paths.json collection failed`

Scope: `/subscriptions/0966098b-4d6c-4f09-af1b-965bc2a2ad1d`

## Why

The collector skips attack paths only when CloudPosture or DefenderCspm pricing is present and every matching tier is Free. That skip warning is `defender-attack-paths-skipped-plan-off`. This run did not emit that skip. It called the API and stored a failure with no HTTP status.

## Fixed scope

- Tenant `5c4694b8-0490-46f0-bd5a-4eb70dd3c0b8`
- Pricings: `GET /subscriptions/0966098b-4d6c-4f09-af1b-965bc2a2ad1d/providers/Microsoft.Security/pricings?api-version=2024-01-01`
- Attack paths: `GET /subscriptions/0966098b-4d6c-4f09-af1b-965bc2a2ad1d/providers/Microsoft.Security/attackPaths?api-version=2024-01-01`

## What to run

Use the current Az context. If `Get-AzContext` is missing, or its tenant is not the tenant above, stop.

1. GET pricings. Record the HTTP status. For `CloudPosture` and `DefenderCspm` only, record `name` and `properties.pricingTier`. Do not print extensions.
2. GET attack paths. Record the HTTP status. On success, record the `value` count only. Do not print display names, resource ids, or path descriptions.

## How to classify

| What you measured | Class |
|-------------------|--------|
| Attack-path 401 or 403 | Permission. Security Reader on the subscription. |
| Both CSPM names are Free, or neither name is present | Plan. Defender CSPM is off, so attack paths are not a collected fact. The package should have been able to skip when the pricing row says Free. If pricing is Free and the attack-path call still failed, say both facts. |
| Attack-path 404 | The attack-path API is not available for this subscription. |
| Attack-path 200 and `value` length 0 | The API works and there are no paths. The next package should omit the failure warning. |
| Attack-path 200 and `value` length greater than 0 | The failure does not reproduce. |
| Other 4xx or 5xx | API error. Quote ARM `error.code` and `error.message`. |

## Report

Reply with the class, both HTTP statuses, the CSPM tier, the path count when the call succeeded, and the single next action. Do not enable a Defender plan. Do not re-run the package script.

## Constraints

- Do not edit the repo.
- Do not commit.
- Do not print attack-path entities.
- Do not re-run DFV-07.
