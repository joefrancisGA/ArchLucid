# EXW-07 — Classify zero policy compliance records

**Model:** Composer 2.5. Paste this file as the whole task. Do not implement EXW-08 in this session.

**Repo:** `c:\ArchLucid`

## Goal

Explain this package result and stop:

`PolicyCompliance` succeeded with `recordCount=0` while `PolicyDefinitions` succeeded with `assignmentCount=60` and `definitionCount=3997`.

Scope: subscription `0966098b-4d6c-4f09-af1b-965bc2a2ad1d`.

## Why

The package script emits an empty `policy-compliance.json` both when Policy Insights returns no rows and when the query throws. This run logged success and `recordCount=0`, with no policy-compliance failure warning. Assignments existing does not imply evaluated compliance rows.

## Fixed scope

- Tenant `5c4694b8-0490-46f0-bd5a-4eb70dd3c0b8`
- Query: `POST /subscriptions/0966098b-4d6c-4f09-af1b-965bc2a2ad1d/providers/Microsoft.PolicyInsights/policyStates/latest/queryResults?api-version=2019-10-01&$top=55`
- Assignments: `GET /subscriptions/0966098b-4d6c-4f09-af1b-965bc2a2ad1d/providers/Microsoft.Authorization/policyAssignments?api-version=2022-06-01`

## What to run

Use the current Az context. If `Get-AzContext` is missing, or its tenant is not the tenant above, stop.

1. GET policy assignments. Record the HTTP status and the `value` count. Follow `nextLink` at most two extra pages. Do not print assignment names.
2. POST the Policy Insights query with body `{}`. Record the HTTP status and the `value` count on the first page. Do not follow more than one `nextLink`. Do not print resource ids.

Read `New-ArchLucidPolicyComplianceDocument` before the probe. A thrown query becomes an empty document plus a failure warning. This package had no such warning.

## How to classify

| What you measured | Class |
|-------------------|--------|
| Query 401 or 403 | Permission. Reader at subscription scope is the documented role. The package's success log means this identity was able to finish the query earlier; say whether that still holds. |
| Query 200 and `value` length 0, assignments greater than 0 | Evaluated compliance is empty. Assignments are not compliance rows. No collector defect is shown by this probe. |
| Query 200 and `value` length greater than 0 | The empty package does not match the live query. Name the counts. Do not edit the collector in this session. |
| Query 404 or other 4xx or 5xx | API error. Quote ARM `error.code` and `error.message`. |

## Report

Reply with the class, both HTTP statuses, the assignment count, the compliance row count, and the single next action. Do not assign roles. Do not re-run the package script.

## Constraints

- Do not edit the repo.
- Do not commit.
- Do not print policy evaluation resource ids.
