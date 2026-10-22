using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence.Stages;

public sealed class GoldenArchitectureInvokeStageResult
{
    public required ClosedLoopReasoningResult ClosedLoopResult { get; init; }

    public required IReadOnlyList<SpecialistReviewFinding> Findings { get; init; }

    public required ArchitectureKnowledgeModel BeforeModel { get; init; }

    public required ArchitectureKnowledgeModel AfterModel { get; init; }

    public required IReadOnlyList<SpecialistReviewFinding> AfterFindings { get; init; }
}
