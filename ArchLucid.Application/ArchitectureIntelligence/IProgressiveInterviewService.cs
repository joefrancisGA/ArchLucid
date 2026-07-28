using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IProgressiveInterviewService
{
    ProgressiveInterviewState BuildFramingState(
        ArchitectureKnowledgeModel model,
        IReadOnlyList<ClosedLoopReasoningSourceText> sourceTexts);

    IReadOnlyList<FramingQuestion> DeriveEvidenceDrivenQuestions(
        IReadOnlyList<SpecialistReviewResult> specialistResults);
}
