using ArchLucid.Contracts.Persistence.Artifacts;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Provenance;

/// <summary>Orchestration-owned boundary payload for <see cref="IProvenanceBuilder.Build" />.</summary>
public sealed class ProvenanceBuildInput
{
    public Guid RunId
    {
        get;
        init;
    }

    public FindingsSnapshot Findings
    {
        get;
        init;
    } = null!;

    public GraphSnapshot Graph
    {
        get;
        init;
    } = null!;

    public ManifestDocument Manifest
    {
        get;
        init;
    } = null!;

    public DecisionTraceDto DecisionTrace
    {
        get;
        init;
    } = null!;

    public IReadOnlyList<SynthesizedArtifact> Artifacts
    {
        get;
        init;
    } = [];
}
