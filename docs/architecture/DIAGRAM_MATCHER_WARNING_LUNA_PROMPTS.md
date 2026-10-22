> **Scope:** Paste-ready GPT-5.6 Luna prompts. Stop the private-endpoint completeness warning from listing every VNet-integrated app against every private-endpoint target, and match private-link hostnames that the inventory already collected. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/diagram-matcher-warning-00-index.md`](../../.cursor/prompts/diagram-matcher-warning-00-index.md), [`.cursor/prompts/diagram-matcher-warning-01-dns-miss-usage.md`](../../.cursor/prompts/diagram-matcher-warning-01-dns-miss-usage.md), [`.cursor/prompts/diagram-matcher-warning-02-privatelink-hosts.md`](../../.cursor/prompts/diagram-matcher-warning-02-privatelink-hosts.md)

# Diagram matcher warnings — Luna prompts

**Created:** 2026-10-11 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Do not implement from this index.

The diagram banner `Inventory completeness warnings (N)` is the distinct list in the snapshot's `CompletenessWarningsJson`. On a large estate that count is about 1177. Most of those strings are not collection failures. `AzureInventoryPrivateEndpointReachableEdgeMapper.MapPeReachableTargets` warns `pe-reachable-dns-link-missing:{compute}:{target}` for every VNet-integrated compute crossed with every private-endpoint target that lacks a DNS join. Ten apps and 120 endpoints is about 1200 warnings for pairs the apps never use. The edge is already omitted. Separately, `AzureInventoryAdfLinkedServiceTargetResolver.ExtractKnownHosts` indexes public hosts only, so an app setting or linked service that stores `{name}.privatelink.…` becomes `app-settings-host-unresolved` even when that resource is in the snapshot.

Both customer packages share these matchers. Script `0.4.7` stays `0.4.7`. A package already collected is enough: the next materialize, including a re-upload of the same ZIP, rewrites the stored warning list. A new Azure collection is not required for these two changes.

| ID | Prompt | Intent |
|----|--------|--------|
| **DMW-01** | [diagram-matcher-warning-01-dns-miss-usage.md](../../.cursor/prompts/diagram-matcher-warning-01-dns-miss-usage.md) | Keep the DNS-joined `peReachableTarget` hop. Warn `pe-reachable-dns-link-missing` only when another collected row already says that compute uses that store. |
| **DMW-02** | [diagram-matcher-warning-02-privatelink-hosts.md](../../.cursor/prompts/diagram-matcher-warning-02-privatelink-hosts.md) | Index private-link host aliases, including Key Vault `vaultcore`, plus queue, table, and file storage hosts. Still omit a host that maps to more than one resource. |

**DMW-01** and **DMW-02** touch different files and may run in either order. Together, a private-link host that names a resource in the snapshot becomes a usage row. If that pair still has no DNS join, **DMW-01** warns once for that pair. It does not warn for the other endpoints.

## Do not pull into these sessions

- Replacing completeness warnings with questionnaire items
- Fan-out of a subscription or resource-group role assignment onto every child
- Hiding `rbac-scope-too-broad` or `app-settings-not-collected-hosted-get-only`
- Hosted POST `config/list`, or persisting app-setting secret values
- Promoting DerivedFact or DeterministicInference to ObservedFact
- A new association type, a new Azure HTTP call, or a `$scriptVersion` bump
- Re-running **SN-PE-04**, **AX-DE**, or **AX-DC** as greenfield
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**
