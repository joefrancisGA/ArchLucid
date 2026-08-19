using ArchLucid.Application.Drafts.QuestionSelection;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Drafts;

/// <summary>
///     Projects L0 MUST intake answers onto <see cref="ArchitectureRequest" /> fields (TB-2283 / TB-2211).
/// </summary>
public static class UniversalIntakeAnswerProjector
{
    private static readonly IReadOnlyDictionary<string, string> InlineRequirementLabels =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["l0.actor.additional-kinds"] = "Additional actor kinds",
            ["l0.pillar.reliability"] = "Reliability",
            ["l0.pillar.operations"] = "Operations",
            ["l0.pillar.performance"] = "Performance",
        };

    private static readonly IReadOnlyDictionary<string, string> ConstraintLabels =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["l0.pillar.security"] = "Security posture",
            ["l0.pillar.cost"] = "Cost",
        };

    /// <summary>
    ///     Merges <see cref="ArchitectureRequest.IntakeQuestionAnswers" /> into request lists and cloud target.
    /// </summary>
    public static void ApplyToRequest(ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.IntakeQuestionAnswers.Count == 0)
            return;

        TransparencyTrail? trail = request.IntakeTransparencyTrail;

        foreach (DraftElicitationQuestion question in UniversalIntakeQuestions.MustQuestions)
        {
            string questionKey = question.QuestionKey;

            if (string.Equals(questionKey, DraftIntakeQuestionKeys.CloudTarget, StringComparison.OrdinalIgnoreCase))
            {
                ApplyCloudTarget(request, questionKey, trail);

                continue;
            }

            string? effectiveAnswer = ResolveEffectiveAnswer(request.IntakeQuestionAnswers, trail, questionKey);

            if (!ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry(effectiveAnswer))
                continue;

            string line = BuildLabeledLine(questionKey, effectiveAnswer!);

            if (ConstraintLabels.ContainsKey(questionKey))
            {
                AppendUnique(request.Constraints, line);

                continue;
            }

            if (InlineRequirementLabels.ContainsKey(questionKey))
                AppendUnique(request.InlineRequirements, line);
        }
    }

    private static void ApplyCloudTarget(ArchitectureRequest request, string questionKey, TransparencyTrail? trail)
    {
        string? effectiveAnswer = ResolveEffectiveAnswer(request.IntakeQuestionAnswers, trail, questionKey);

        if (string.IsNullOrWhiteSpace(effectiveAnswer))
            return;

        if (string.Equals(
                effectiveAnswer.Trim(),
                ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview,
                StringComparison.Ordinal))
        {
            request.CloudProvider = CloudProvider.None;

            return;
        }

        if (Enum.TryParse(effectiveAnswer, ignoreCase: true, out CloudProvider provider))
            request.CloudProvider = provider;
    }

    private static string? ResolveEffectiveAnswer(
        IReadOnlyDictionary<string, string> questionAnswers,
        TransparencyTrail? trail,
        string questionKey)
    {
        if (questionAnswers.TryGetValue(questionKey, out string? answer) && !string.IsNullOrWhiteSpace(answer))
            return answer.Trim();

        bool skipped = trail?.Skipped.Exists(entry =>
            string.Equals(entry.QuestionKey, questionKey, StringComparison.OrdinalIgnoreCase)) ?? false;

        if (!skipped)
            return null;

        return ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview;
    }

    private static string BuildLabeledLine(string questionKey, string effectiveAnswer)
    {
        if (InlineRequirementLabels.TryGetValue(questionKey, out string? inlineLabel))
            return $"{inlineLabel}: {effectiveAnswer}";

        if (ConstraintLabels.TryGetValue(questionKey, out string? constraintLabel))
            return $"{constraintLabel}: {effectiveAnswer}";

        return effectiveAnswer;
    }

    private static void AppendUnique(List<string> target, string line)
    {
        if (target.Exists(existing => string.Equals(existing, line, StringComparison.Ordinal)))
            return;

        target.Add(line);
    }
}
