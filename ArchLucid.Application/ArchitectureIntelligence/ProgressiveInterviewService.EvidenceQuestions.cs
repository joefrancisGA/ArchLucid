using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed partial class ProgressiveInterviewService
{
    public IReadOnlyList<FramingQuestion> DeriveEvidenceDrivenQuestions(
        IReadOnlyList<SpecialistReviewResult> specialistResults)
    {
        ArgumentNullException.ThrowIfNull(specialistResults);

        List<FramingQuestion> questions = [];
        int questionIndex = 0;

        foreach (SpecialistReviewFinding finding in specialistResults.SelectMany(result => result.Findings))
        {
            if (finding.Conclusion != ReviewConclusion.Indeterminate)
            {
                continue;
            }

            if (finding.EvidenceCondition != EvidenceCondition.Insufficient)
            {
                continue;
            }

            questionIndex++;
            questions.Add(new FramingQuestion
            {
                QuestionId = $"evidence-{questionIndex}",
                Prompt = $"Provide evidence for: {finding.Title}",
                IsAnswered = false,
                InferredAnswer = finding.Rationale,
                Source = FramingQuestionSource.EvidenceDriven,
            });
        }

        return questions;
    }
}
