using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Analysis;

/// <summary>Resolved input supplied by a trusted scoped rehearsal, never bound from an HTTP request.</summary>
internal sealed record AuthorityTopologyShadowPreparation(
    ProjectScopeKey Scope, FindingAnalysisContext Context, PolicyPackExpectationFacet Policy,
    string PolicyPinWitness, string EvidencePinWitness, string CoverageWitness, string ConfigurationWitness,
    AuthorityTopologyCoverage Coverage);
