using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Decisioning.Models;
namespace ArchLucid.Provenance;

public interface IProvenanceBuilder
{
    /// <summary>Builds a structural provenance graph for one authority run (captured during execution).</summary>
    DecisionProvenanceGraph Build(ProvenanceBuildInput input);
}
