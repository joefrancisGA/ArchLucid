using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

internal static partial class ClosedLoopReasoningResultCloner
{
    private static ProgressiveInterviewState CloneInterview(ProgressiveInterviewState interview)
    {
        return new ProgressiveInterviewState
        {
            ModelId = interview.ModelId,
            FramingQuestions = interview.FramingQuestions.Select(CloneFramingQuestion).ToList(),
            EvidenceDrivenQuestions = interview.EvidenceDrivenQuestions.Select(CloneFramingQuestion).ToList(),
            IsFramingComplete = interview.IsFramingComplete,
        };
    }

    private static FramingQuestion CloneFramingQuestion(FramingQuestion question)
    {
        return new FramingQuestion
        {
            QuestionId = question.QuestionId,
            Prompt = question.Prompt,
            IsAnswered = question.IsAnswered,
            ConfirmedAnswer = question.ConfirmedAnswer,
            InferredAnswer = question.InferredAnswer,
            Source = question.Source,
        };
    }
}
