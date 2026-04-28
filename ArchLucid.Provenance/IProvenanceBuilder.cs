using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.DecisionTraces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Provenance;

public interface IProvenanceBuilder
{
    /// <summary>Builds a structural provenance graph for one authority run (captured during execution).</summary>
    DecisionProvenanceGraph Build(
        Guid runId,
        FindingsSnapshot findings,
        GraphSnapshot graph,
        ManifestDocument manifest,
        DecisionTrace trace,
        IReadOnlyList<SynthesizedArtifact> artifacts);
}
