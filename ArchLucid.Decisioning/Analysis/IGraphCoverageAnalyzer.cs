using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

public interface IGraphCoverageAnalyzer
{
    TopologyCoverageResult AnalyzeTopology(GraphSnapshot graphSnapshot);

    SecurityCoverageResult AnalyzeSecurity(GraphSnapshot graphSnapshot);

    PolicyCoverageResult AnalyzePolicy(GraphSnapshot graphSnapshot);

    RequirementCoverageResult AnalyzeRequirements(GraphSnapshot graphSnapshot);
}
