# EXW-03 — Classify the Defender security-contact failure

**Model:** Composer 2.5. Paste this file as the whole task. Do not implement EXW-04 in this session.

**Repo:** `c:\ArchLucid`

## Goal

Classify these two package warnings and stop:

- `defender-security-contacts-not-collected`
- `defender-security-contacts.json collection failed`

Scope: `/subscriptions/0966098b-4d6c-4f09-af1b-965bc2a2ad1d`

## Why

Both lines are one failed call. `Get-ArchLucidAzureDefenderArmValues` stores `defender-security-contacts.json collection failed` and drops the HTTP status. The package then adds `defender-security-contacts-not-collected` and a row with `collectionStatus` `Unavailable`. An empty contact list is a different warning: `defender-security-contact-missing`.

## Fixed scope

- Tenant `5c4694b8-0490-46f0-bd5a-4eb70dd3c0b8`
- Call: `GET /subscriptions/0966098b-4d6c-4f09-af1b-965bc2a2ad1d/providers/Microsoft.Security/securityContacts?api-version=2020-01-01`

## What to run

Use the current Az context. If `Get-AzContext` is missing, or its tenant is not the tenant above, stop.

GET the path above. Record the HTTP status. On success, record the `value` count and whether any contact has a non-empty `properties.emails`. Do not print email addresses, phone numbers, or the response body.

## How to classify

| Status | Class |
|--------|--------|
| 401 or 403 | Permission. Grant Security Reader on the subscription to the collecting identity. |
| 404 | Security contacts are not available on this subscription. The Unavailable row is expected until Defender exposes the API. |
| Other 4xx or 5xx | API error. Quote ARM `error.code` and `error.message`. |
| 200 and at least one email | The failure does not reproduce. A fresh package run should store `Collected`. |
| 200 and no emails | The API works. The next package should warn `defender-security-contact-missing`, not `defender-security-contacts-not-collected`. |

## Report

Reply with the class, the HTTP status, and the single next action. Do not grant a role. Do not re-run the package script.

## Constraints

- Do not edit the repo.
- Do not commit.
- Do not print contact emails or phone numbers.
- Do not re-run DFV-09.
