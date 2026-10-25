# EXW-04 — Classify the Defender governance warnings

**Model:** Composer 2.5. Paste this file as the whole task. Do not implement EXW-05 or EXW-08 in this session.

**Repo:** `c:\ArchLucid`

## Goal

Classify these two package warnings and stop:

- `defender-governance-truncated`
- `defender-governance.json collection failed; HTTP 404; api-version 2022-01-01-preview`

Scope: `/subscriptions/0966098b-4d6c-4f09-af1b-965bc2a2ad1d`

## Why

The customer script adds the text `HTTP 404` when the subscription governance list fails and a short per-assessment walk also fails. It does that even when the status was not 404. `defender-governance-truncated` means more than 40 assessment keys were available for that walk. The live status is still unknown.

## Fixed scope

- Tenant `5c4694b8-0490-46f0-bd5a-4eb70dd3c0b8`
- Subscription list: `GET /subscriptions/0966098b-4d6c-4f09-af1b-965bc2a2ad1d/providers/Microsoft.Security/governanceAssignments?api-version=2022-01-01-preview`
- API version on the warning: `2022-01-01-preview`

## What to run

Use the current Az context. If `Get-AzContext` is missing, or its tenant is not the tenant above, stop.

1. GET the subscription governance list. Record the HTTP status. On success, record the `value` count only.
2. GET `providers/Microsoft.Security/assessments?api-version=2021-06-01` for the same subscription. Record the HTTP status and the number of assessment names. Do not print assessment display names.
3. When the subscription governance list is not 200, GET governance assignments for the first three assessment names only: `providers/Microsoft.Security/assessments/{name}/governanceAssignments?api-version=2022-01-01-preview`. Record each HTTP status. Do not walk more than three.

Read the fallback in `Get-ArchLucidAzureDefenderFollowOnBundle` before the probe. The script stamps `HTTP 404` after three misses. Your report must use the statuses you measured.

## How to classify

| What you measured | Class |
|-------------------|--------|
| Subscription list 401 or 403 | Permission. Security Reader on the subscription. |
| Subscription list 404, and the three assessment calls are also 404 | Governance assignments are not offered for this subscription at `2022-01-01-preview`. The package warning's 404 text matches the API. |
| Subscription list failed with a status other than 404 | The package text `HTTP 404` is wrong for this run. Name the real status. EXW-08 is the code fix. Do not edit code in this session. |
| 200 and more than 40 assessments existed for the fallback | `defender-governance-truncated` matches the 40-key cap. |
| 200 with a `value` array | Governance collection can succeed on the next package run. |

## Report

Reply with the class, each HTTP status, the assessment count, and whether the package's `HTTP 404` text matches the live call. Do not grant a role. Do not re-run the package script.

## Constraints

- Do not edit the repo.
- Do not commit.
- Do not print governance owner names or email addresses.
- Do not re-run DFV-04.
