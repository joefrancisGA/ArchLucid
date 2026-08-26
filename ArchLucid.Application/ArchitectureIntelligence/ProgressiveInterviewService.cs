using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class ProgressiveInterviewService : IProgressiveInterviewService
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

    public ProgressiveInterviewState ApplyAnswers(
        ArchitectureKnowledgeModel model,
        ProgressiveInterviewState state,
        IReadOnlyDictionary<string, string> answers)
    {
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(state);
        ArgumentNullException.ThrowIfNull(answers);

        foreach (KeyValuePair<string, string> pair in answers)
        {
            if (string.IsNullOrWhiteSpace(pair.Key) || string.IsNullOrWhiteSpace(pair.Value))
            {
                continue;
            }

            model.FramingAnswers[pair.Key] = pair.Value.Trim();

            FramingQuestion? framingQuestion = state.FramingQuestions
                .FirstOrDefault(question => string.Equals(question.QuestionId, pair.Key, StringComparison.Ordinal));

            if (framingQuestion is not null)
            {
                framingQuestion.ConfirmedAnswer = pair.Value.Trim();
                framingQuestion.IsAnswered = true;
            }

            FramingQuestion? evidenceQuestion = state.EvidenceDrivenQuestions
                .FirstOrDefault(question => string.Equals(question.QuestionId, pair.Key, StringComparison.Ordinal));

            if (evidenceQuestion is not null)
            {
                evidenceQuestion.ConfirmedAnswer = pair.Value.Trim();
                evidenceQuestion.IsAnswered = true;
            }

            // Persist answered evidence as user-asserted model elements for the next review pass.
            UpsertInterviewEvidenceElement(model, pair.Key, pair.Value.Trim());
        }

        state.IsFramingComplete = state.FramingQuestions.All(question => question.IsAnswered);

        return state;
    }

    private static void UpsertInterviewEvidenceElement(
        ArchitectureKnowledgeModel model,
        string questionId,
        string answer)
    {
        ArchitectureModelElement? existing = model.Elements
            .FirstOrDefault(element => element.Kind == ArchitectureElementKind.Evidence
                && element.Properties.TryGetValue("framingQuestionId", out string? storedQuestionId)
                && string.Equals(storedQuestionId, questionId, StringComparison.Ordinal));

        if (existing is not null)
        {
            existing.Name = $"Interview answer: {questionId}";
            existing.Description = answer;
            existing.ExtractionConfidence = 1.0;
            existing.Provenance = new ClaimProvenance
            {
                Origin = ClaimOrigin.UserAsserted,
                SupportStatus = SupportStatus.DirectlyEstablished,
                Confidence = 1.0,
                Notes = "Operator interview answer.",
            };

            return;
        }

        model.Elements.Add(new ArchitectureModelElement
        {
            ElementId = Guid.NewGuid().ToString("N"),
            Kind = ArchitectureElementKind.Evidence,
            Name = $"Interview answer: {questionId}",
            Description = answer,
            ExtractionConfidence = 1.0,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["framingQuestionId"] = questionId,
            },
            Provenance = new ClaimProvenance
            {
                Origin = ClaimOrigin.UserAsserted,
                SupportStatus = SupportStatus.DirectlyEstablished,
                Confidence = 1.0,
                Notes = "Operator interview answer.",
            },
        });
    }

    private static string? TryInferAnswer(
        string questionId,
        string combinedText,
        ArchitectureKnowledgeModel model)
    {
        return questionId switch
        {
            "business-outcome" => InferBusinessOutcome(combinedText, model),
            "system-boundary" => InferSystemBoundary(combinedText),
            "fixed-decisions" => InferFixedDecisions(combinedText, model),
            "critical-quality-attributes" => InferCriticalQualityAttributes(combinedText, model),
            "unacceptable-failures" => InferUnacceptableFailures(combinedText),
            "architecture-kind" => InferArchitectureKind(combinedText),
            _ => null,
        };
    }

    private static string? InferBusinessOutcome(string combinedText, ArchitectureKnowledgeModel model)
    {
        ArchitectureModelElement? objective = model.Elements
            .FirstOrDefault(element => element.Kind == ArchitectureElementKind.BusinessObjective);

        if (objective is not null)
        {
            return objective.Name;
        }

        if (combinedText.Contains("business outcome", StringComparison.OrdinalIgnoreCase))
        {
            return ExtractLineValue(combinedText, "business outcome");
        }

        return null;
    }

    private static string? InferSystemBoundary(string combinedText)
    {
        if (combinedText.Contains("system boundary", StringComparison.OrdinalIgnoreCase))
        {
            return ExtractLineValue(combinedText, "system boundary");
        }

        string? inScope = ExtractLineValue(combinedText, "in scope");
        string? outOfScope = ExtractLineValue(combinedText, "out of scope");
        List<string> boundaryParts = [];

        if (!string.IsNullOrWhiteSpace(inScope))
        {
            boundaryParts.Add($"In scope: {inScope.Trim()}");
        }

        if (!string.IsNullOrWhiteSpace(outOfScope))
        {
            boundaryParts.Add($"Out of scope: {outOfScope.Trim()}");
        }

        if (boundaryParts.Count > 0)
        {
            return string.Join(" ", boundaryParts);
        }

        if (combinedText.Contains("in scope", StringComparison.OrdinalIgnoreCase)
            || combinedText.Contains("out of scope", StringComparison.OrdinalIgnoreCase))
        {
            return "Scope boundaries referenced in source material.";
        }

        return null;
    }

    private static string? InferFixedDecisions(string combinedText, ArchitectureKnowledgeModel model)
    {
        List<ArchitectureModelElement> decisions = model.Elements
            .Where(element => element.Kind == ArchitectureElementKind.Decision)
            .ToList();

        if (decisions.Count > 0)
        {
            return string.Join("; ", decisions.Select(decision => decision.Name));
        }

        if (combinedText.Contains("fixed decision", StringComparison.OrdinalIgnoreCase))
        {
            return ExtractLineValue(combinedText, "fixed decision");
        }

        return null;
    }

    private static string? InferCriticalQualityAttributes(string combinedText, ArchitectureKnowledgeModel model)
    {
        List<ArchitectureModelElement> qualityAttributes = model.Elements
            .Where(element => element.Kind == ArchitectureElementKind.QualityAttribute)
            .ToList();

        if (qualityAttributes.Count > 0)
        {
            return string.Join("; ", qualityAttributes.Select(attribute => attribute.Name));
        }

        if (combinedText.Contains("availability", StringComparison.OrdinalIgnoreCase)
            || combinedText.Contains("security", StringComparison.OrdinalIgnoreCase))
        {
            return "Availability and security called out in source material.";
        }

        return null;
    }

    private static string? InferUnacceptableFailures(string combinedText)
    {
        if (combinedText.Contains("unacceptable", StringComparison.OrdinalIgnoreCase))
        {
            return ExtractLineValue(combinedText, "unacceptable");
        }

        if (combinedText.Contains("must not fail", StringComparison.OrdinalIgnoreCase))
        {
            return "Must-not-fail constraints referenced in source material.";
        }

        string? failureMode = ExtractLineValue(combinedText, "failure mode");

        if (!string.IsNullOrWhiteSpace(failureMode))
        {
            return failureMode;
        }

        if (combinedText.Contains("failure mode and recovery", StringComparison.OrdinalIgnoreCase))
        {
            return ExtractLineValue(combinedText, "failure mode and recovery");
        }

        return null;
    }

    private static string? InferArchitectureKind(string combinedText)
    {
        if (combinedText.Contains("migration", StringComparison.OrdinalIgnoreCase))
        {
            return "Migration";
        }

        if (combinedText.Contains("greenfield", StringComparison.OrdinalIgnoreCase))
        {
            return "Greenfield";
        }

        if (combinedText.Contains("integration", StringComparison.OrdinalIgnoreCase))
        {
            return "Integration";
        }

        return null;
    }

    private static string? ExtractLineValue(string combinedText, string marker)
    {
        string? line = combinedText
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault(candidate => candidate.Contains(marker, StringComparison.OrdinalIgnoreCase));

        if (line is null)
        {
            return null;
        }

        int separatorIndex = line.IndexOf(':', StringComparison.Ordinal);

        if (separatorIndex < 0)
        {
            separatorIndex = line.IndexOf('-', StringComparison.Ordinal);
        }

        if (separatorIndex < 0 || separatorIndex >= line.Length - 1)
        {
            return line.Trim();
        }

        return line[(separatorIndex + 1)..].Trim();
    }

    private sealed record FramingQuestionTemplate(string QuestionId, string Prompt);
}
