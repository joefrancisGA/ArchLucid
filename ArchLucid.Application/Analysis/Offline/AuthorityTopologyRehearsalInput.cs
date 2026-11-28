using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Analysis;

/// <summary>Offline fixture input. Its provenance is supplied by a trusted rehearsal, not established by this type.</summary>
internal sealed record AuthorityTopologyRehearsalInput(
    ProjectScopeKey Scope, GraphSnapshot Graph, string ContextWitness, string PolicyWitness,
    string EvidenceWitness, string ConfigurationWitness, AuthorityTopologyCoverage Coverage,
    string ProjectionVersion, Guid EngineBuild);
