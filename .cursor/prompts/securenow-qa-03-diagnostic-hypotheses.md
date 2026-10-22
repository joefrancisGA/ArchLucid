# SN-QA-03 — Diagnostic hypotheses and deterministic elimination

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement SN-QA-04 in this session.

**Repo:** `c:\ArchLucid`

## Goal

Add diagnostic hypotheses to the current SecureNow architect plane. A hypothesis is an investigation claim. It is not an operational finding, a graph node, or a buyer-facing probability.

## Why

The path engines already jump from evidence to a path or finding. The current product needs a prior step: evidence can support, contradict, or eliminate an explanation before that explanation becomes a conclusion. Deterministic constraints should kill impossible explanations without a model call.

## Read first

- `docs/library/SECURENOW_ARCHITECT_PLANE.md`
- `ArchLucid.Core/InfraEvidence/PathKind.cs`
- `ArchLucid.Core/InfraEvidence/PathConfidenceBand.cs`
- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/IntendedReachabilityPathEnumerator.cs`
- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/PrivilegePathEnumerator.cs`
- The existing path inspector or path-detail read model. Extend it. Do not add a second product surface if that read model already exists.

## What to build

Add a small hypothesis model computed from persisted paths and their hops:

- `HypothesisId`
- `TenantId`, `SnapshotId`
- hypothesis kind: `ExternalReachability`, `PrivilegeEscalation`, `SensitiveExposure`
- status: `Open`, `Eliminated`, `Concluded`
- cited path ids and evidence references
- `PathConfidenceBand` for the supporting evidence
- a short elimination or support reason

Generate hypotheses only from existing path evidence. Do not invent resources or edges.

Required deterministic behavior:

1. An `ExternalReachability` hypothesis whose cited paths contain no public-exposure hop (`InternetPublicExposureNodeId`, `PublicNetworkAccessHopEdgeType`, `Exposes`, or `RoutesTo`) becomes `Eliminated`. Record the missing exposure evidence as the reason.
2. An `ExternalReachability` hypothesis with one of those hops stays `Open` unless an existing operational finding already cites the same path. In that case it may be `Concluded` and must cite that finding. Do not create a new `OperationalSecurityFinding`.
3. A `PrivilegeEscalation` hypothesis stays `Open` when a privilege path contains `HasRole` or `UsesIdentity` plus `CanWrite`. It becomes `Eliminated` when the path has neither identity hop.
4. A `SensitiveExposure` hypothesis stays `Open` when a public-exposure hop reaches storage, SQL, or Key Vault. It does not claim the data is regulated unless an active crown-jewel assertion already says so.

Surface the hypotheses on the existing path-detail read model, grouped by status. Empty snapshots return an empty list.

## Acceptance criteria

- Hypotheses carry tenant and snapshot identity.
- Eliminated hypotheses cite the constraint that eliminated them.
- No hypothesis becomes `ObservedFact` or an operational finding by itself.
- Confidence remains an ordinal `PathConfidenceBand`. No numeric confidence, percentage, or multiplicative score.
- No LLM call, no Azure write, no new `IFindingEngine`, and no new collector.
- Unit tests cover all four required behaviors with synthetic paths. Expected statuses are hand-authored.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- One class per file. No `ConfigureAwait(false)` in tests.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`
- Run only the new hypothesis tests and the existing path read-model test that covers the surface you changed.
- Do not commit.

## Done when

A reviewer can see which explanations were eliminated by evidence, which remain open, and which only conclude because an existing finding already cites the same path.
