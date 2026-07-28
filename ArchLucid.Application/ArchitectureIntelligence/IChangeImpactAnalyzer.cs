using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IChangeImpactAnalyzer
{
    ChangeImpactResult Analyze(
        ArchitectureKnowledgeModel model,
        ArchitectureRecommendation recommendation);
}
