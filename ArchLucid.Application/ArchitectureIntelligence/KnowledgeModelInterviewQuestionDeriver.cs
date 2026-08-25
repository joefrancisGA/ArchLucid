using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Clarifications;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Ranks <see cref="ArchitectureElementKind.UnresolvedQuestion" /> elements for create-home interview
///     surfaces — blocked governance checks first, then other model-backed gaps.
/// </summary>
public static class KnowledgeModelInterviewQuestionDeriver
{
    internal const string BlockedCheckNamePrefix = "blocked-check:";

    public static IReadOnlyList<ReviewClarificationQuestion> Derive(ArchitectureKnowledgeModel? model)
    {
        if (model is null)
            return [];

        List<(ReviewClarificationQuestion Question, int Rank)> ranked = [];

        foreach (ArchitectureModelElement element in model.Elements)
        {
            if (element.Kind != ArchitectureElementKind.UnresolvedQuestion)
                continue;

            if (string.IsNullOrWhiteSpace(element.Name) && string.IsNullOrWhiteSpace(element.Description))
                continue;

            bool blockedCheck = element.Name.StartsWith(BlockedCheckNamePrefix, StringComparison.OrdinalIgnoreCase);
            bool adversarialLane = ContainsAdversarialLaneSignal(element);

            string prompt = BuildPrompt(element, blockedCheck);
            string questionId = ResolveQuestionId(element);

            ranked.Add((
                new ReviewClarificationQuestion
                {
                    QuestionId = questionId,
                    Prompt = prompt,
                    SourceFindingId = blockedCheck
                        ? element.Name[BlockedCheckNamePrefix.Length..]
                        : element.ElementId,
                    SourceFindingType = blockedCheck
                        ? "KnowledgeModel.BlockedCheck"
                        : adversarialLane
                            ? "KnowledgeModel.AdversarialChallenge"
                            : "KnowledgeModel.UnresolvedQuestion",
                    Severity = blockedCheck
                        ? FindingSeverity.Error
                        : adversarialLane
                            ? FindingSeverity.Warning
                            : FindingSeverity.Warning,
                    MissingItem = prompt,
                },
                blockedCheck ? 0 : adversarialLane ? 1 : 2));
        }

        return ranked
            .OrderBy(static entry => entry.Rank)
            .ThenByDescending(static entry => entry.Question.Severity)
            .ThenBy(static entry => entry.Question.QuestionId, StringComparer.Ordinal)
            .Select(static entry => entry.Question)
            .ToList();
    }

    private static string ResolveQuestionId(ArchitectureModelElement element)
    {
        if (!string.IsNullOrWhiteSpace(element.ElementId))
            return $"km-{element.ElementId}";

        return $"km-{element.Name.Trim()}";
    }

    private static string BuildPrompt(ArchitectureModelElement element, bool blockedCheck)
    {
        string description = (element.Description ?? string.Empty).Trim();

        if (description.Length > 0)
            return description;

        string name = (element.Name ?? string.Empty).Trim();

        if (blockedCheck && name.Length > BlockedCheckNamePrefix.Length)
            return $"Resolve blocked governance check for finding {name[BlockedCheckNamePrefix.Length..]}.";

        return name.Length > 0 ? name : "Unresolved architecture question";
    }

    private static bool ContainsAdversarialLaneSignal(ArchitectureModelElement element)
    {
        string notes = (element.Provenance?.Notes ?? string.Empty).Trim();

        if (notes.Contains("Adversarial challenge lane", StringComparison.OrdinalIgnoreCase))
            return true;

        string combined = $"{element.Name} {element.Description}";

        return combined.Contains("adversarial challenge", StringComparison.OrdinalIgnoreCase)
            || combined.Contains("falsify/confirm", StringComparison.OrdinalIgnoreCase);
    }
}
