# Change-impact summary (PR / release note template)

Copy into PR descriptions or release notes when buyer-facing behavior changes.

## Who is affected

- [ ] Buyer evaluators
- [ ] Pilot operators
- [ ] Enterprise security reviewers
- [ ] Integrators (OpenAPI/CLI)
- [ ] Internal contributors only

## What changed

_One paragraph — outcome, not file list._

## Action required

- [ ] None
- [ ] Re-run preflight / smoke
- [ ] Update tenant config
- [ ] Regenerate OpenAPI client (see [`OPENAPI_CLIENT_DRIFT_OPERATOR_NOTE.md`](OPENAPI_CLIENT_DRIFT_OPERATOR_NOTE.md))

## Compatibility

- API: [ ] additive [ ] breaking (link `BREAKING_CHANGES.md`)
- UI: [ ] visual only [ ] route change
- Data: [ ] migration required

## Rollback / mitigation

_How to revert safely._

## Deferred scope impact

_Does this touch V1.1/V2 items? If yes, label as deferred — not shipped._

## Evidence / tests

_Links to smoke output, integration test names, or evidence bundle path._
