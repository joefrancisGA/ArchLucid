using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IProgressiveInterviewService
{
    ProgressiveInterviewState BuildFramingState(
        ArchitectureKnowledgeModel model,
        IReadOnlyList<ClosedLoopReasoningSourceText> sourceTexts);

    IReadOnlyList<FramingQuestion> DeriveEvidenceDrivenQuestions(
        IReadOnlyList<SpecialistReviewResult> specialistResults);

    /// <summary>
    /// Applies operator answers to interview state and model framing answers (round-trip).
    /// </summary>
    ProgressiveInterviewState ApplyAnswers(
        ArchitectureKnowledgeModel model,
        ProgressiveInterviewState state,
        IReadOnlyDictionary<string, string> answers);
}
