using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed partial class ProgressiveInterviewService
{
    private static readonly IReadOnlyList<FramingQuestionTemplate> FramingTemplates =
    [
        new("business-outcome", "What business outcome must this architecture deliver?"),
        new("system-boundary", "What is inside and outside the system boundary?"),
        new("fixed-decisions", "Which decisions are already fixed and non-negotiable?"),
        new("critical-quality-attributes", "Which quality attributes are critical for success?"),
        new("unacceptable-failures", "What failures are unacceptable?"),
        new("architecture-kind", "What kind of architecture is this (e.g., migration, greenfield, integration)?"),
    ];

    public ProgressiveInterviewState BuildFramingState(
        ArchitectureKnowledgeModel model,
        IReadOnlyList<ClosedLoopReasoningSourceText> sourceTexts)
    {
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(sourceTexts);

        string combinedText = string.Join(
            "\n",
            sourceTexts.Select(source => source.Content ?? string.Empty));

        List<FramingQuestion> questions = [];

        foreach (FramingQuestionTemplate template in FramingTemplates)
        {
            string? inferredAnswer = TryInferAnswer(template.QuestionId, combinedText, model);

            if (!string.IsNullOrWhiteSpace(inferredAnswer))
            {
                model.FramingAnswers[template.QuestionId] = inferredAnswer;
            }

            bool isAnswered = !string.IsNullOrWhiteSpace(inferredAnswer)
                || model.FramingAnswers.TryGetValue(template.QuestionId, out string? existingAnswer)
                    && !string.IsNullOrWhiteSpace(existingAnswer);

            if (isAnswered)
            {
                continue;
            }

            questions.Add(new FramingQuestion
            {
                QuestionId = template.QuestionId,
                Prompt = template.Prompt,
                IsAnswered = false,
                Source = FramingQuestionSource.Framing,
            });
        }

        return new ProgressiveInterviewState
        {
            ModelId = model.ModelId,
            FramingQuestions = questions,
            IsFramingComplete = questions.Count == 0,
        };
    }
}
