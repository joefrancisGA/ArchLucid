using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IChangeImpactAnalyzer
{
    ChangeImpactResult Analyze(
        ArchitectureKnowledgeModel model,
        ArchitectureRecommendation recommendation);

    /// <summary>Diff-aware impact analysis (TB-1987).</summary>
    ChangeImpactResult Analyze(
        ArchitectureModelDiff diff,
        ArchitectureRecommendation recommendation);
}
