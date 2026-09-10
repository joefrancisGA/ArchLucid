# SA-20 — Optional Entra directory adapter

**Do not** enable Entra Global Reader. Follow [`.cursor/prompts/securenow-architect-00-index.md`](securenow-architect-00-index.md) global constraints.

## Goal

Optional, default-off Graph reads for group membership / directory role eligibility **only** with documented least-privilege scopes, so privilege paths can traverse `memberOf` when the tenant grants them. Inaccessible → InsufficientEvidence hop / collection warning, never silent role expansion.

## Why

Group-nested RBAC is real transitive privilege. Global Reader and directory dumps are out of the IE plane. SecureNow must not become an Entra warehouse in this set.

## Context

- IE plane §2 “No customer write roles” / Graph scopes
- IE-02 “optional Graph GETs, default off, fail soft”
- SA-03 engine extension point

## What to build

1. Feature flag default **off**. Document Graph scopes (e.g. GroupMember.Read.All **or** narrower) in extractor backlog/help — no new coverage engine.
2. Persist group-membership relationships as ObservedFact only from Graph GET; do not expand nested groups unbounded without a depth cap.
3. Privilege engine uses memberOf when rows exist.
4. Tests: flag off → no Graph client call (mock); 403 → warning, engines still run; nested group depth cap; grep no Global Reader.

## Acceptance criteria

- Same hosted ARM client family; Graph is explicit optional.
- PIM standing vs eligible: if you cannot distinguish, hop is InsufficientEvidence `pim-eligibility-unknown`, not Confirmed Owner.

## Constraints

- Compile: `ArchLucid.Integrations.AzureExtractor.Tests` and Application tests if the engine changes.

## Done when

Group-nested Contributor can appear as a privilege path **only** when Graph evidence exists.
