# IS-13 — Continuity follows the seat, not this browser

**Do not fork AD-05** (honesty that last-visit is localStorage). **Do not fork CD-11** (Overview last-open). **Do not fork WA-14** (prefs). This file changes the **source of truth**: last-open package, last-visit watermark, and Working start resolver inputs (IS-03) persist **per user on the server** (existing account pref API if one exists; otherwise extend it). localStorage may cache, not own.

## Goal

A Working architect who signs in on a second machine resumes the same last-open review/draft and sees the same “new since last visit” watermark. Clearing site data does not invent “everything is new.” Demo/trial may stay device-local.

## Why

Professionals switch laptops. Casual SPAs store the day in `localStorage`. AD-05 only labeled the lie.

## Context

- Account / user preference APIs (`SetProfessionalWorkbenchEnabledRequest` pattern — grep user prefs)
- `professional-workbench-preference.ts`
- Last-visit watermark keys (AD-05)
- Overview last-open (CD-11)
- `use-livelihood-document-guards.ts` — not a substitute for server resume
- ADR 0037 tenant isolation — prefs are user-in-tenant, not cross-tenant

## What to build

1. Identify existing user-preference PATCH (workbench already has a server flag). Add last-open review id, last-open draft id, last-visit watermark timestamp **or** reuse one JSON blob with version. One class per file on the C# side.
2. Working Overview / IS-03 resolver reads server prefs after `/me` (or existing bundle). localStorage is a cache.
3. Copy: remove “this browser only” where it would now be false; keep it on Guided if still local.
4. Vitest + API tests for round-trip. Scoped compile for any new C# types.

## Acceptance criteria

- Two browsers, same user: last-open agrees after refresh.
- Cleared localStorage still restores last-open from the API.
- No token or secret in localStorage.

## Constraints

- Do not invent live presence.
- Do not store tokens in localStorage (IS-15).
- Terraform not required if the table already exists; if a new table is required, it must be in the single SQL DDL file for that database.
