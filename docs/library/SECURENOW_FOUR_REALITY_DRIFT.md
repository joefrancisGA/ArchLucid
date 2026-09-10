> **Scope:** Contributor-reference — SecureNow four-reality drift engine over privilege/reachability paths. Internal engineering only.

# SecureNow four-reality path drift (SA-12)

Rule version: post-materialize engine on snapshot B after privilege/reachability paths and IE-06 diff.

## Goal

When a privilege or intended-reachability path depends on a path-relevant control (public access, private endpoint posture, NSG/RBAC widening), compare:

| Reality | Source | Provenance on finding copy |
|---------|--------|----------------------------|
| **Observed Azure** | Current inventory snapshot properties | ObservedFact hop |
| **Advisory Terraform** | `tf.public_network_access` / declaration keys on the resource | DerivedFact |
| **Diagram** | IE-19 reconciliation row label (when present) | DeterministicInference / HumanAssertion (not relabeled) |
| **Historical** | Prior snapshot + IE-06 diff (`NetworkExposureChanged`, `PermissionChanged`) | Temporal IE-06 change |

Emit `PathKind=FourRealityDrift` when **observed Azure is public/widened** while at least one other reality indicates **private/closed**.

## Drift path shape

- Copies hops from the source privilege/reachability path
- Appends a terminal `four-reality-drift` hop (`ObservedFact`) on the widened resource
- Finding cites **PathId** and **ChangeId** (metadata + description) when an inventory diff row exists

## Non-goals

- AI must not write IE-06 change rows
- Missing diagram file does not invent firewall intent — temporal-only drift still applies
- Not a generic CIS property miss

## Engine order

Post-materialize coordinator runs four-reality drift **after** shared-control blast radius and **before** path ranking (SA-09).

## Control id

`securenow.four-reality-drift`
