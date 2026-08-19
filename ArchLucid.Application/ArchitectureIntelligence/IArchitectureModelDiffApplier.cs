using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IArchitectureModelDiffApplier
{
    ArchitectureModelDiff ApplyRecommendation(
        ArchitectureKnowledgeModel beforeModel,
        ArchitectureRecommendation recommendation);
}
