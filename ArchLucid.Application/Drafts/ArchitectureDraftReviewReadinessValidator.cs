using System.Text.RegularExpressions;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Application.Drafts;

/// <summary>Fail-closed review-start readiness for architecture drafts (TB-2282).</summary>
public static partial class ArchitectureDraftReviewReadinessValidator
{
    private const int MinimumOutcomeLength = 10;

    [GeneratedRegex(@"\d")]
    private static partial Regex NumericTokenPattern();

    public static IReadOnlyList<string> EvaluateBlockers(DraftRequestDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);

        if (!IsCreateArchitectureDraft(document))
            return [];

        List<string> blockers = [];

        if (string.IsNullOrWhiteSpace(document.SystemName))
            blockers.Add("system name");

        if (document.FreeTextIntent.Trim().Length < DraftIntakeValidation.MinimumFreeTextIntentLength)
            blockers.Add("architecture overview");

        if (document.BusinessOutcome?.Trim().Length < MinimumOutcomeLength)
            blockers.Add("business outcome");

        if (!ListHasConfirmedEntry(document.StructuredBrief.ConfirmedConstraints))
            blockers.Add("constraint");

        if (!ListHasConfirmedEntry(document.StructuredBrief.ConfirmedAssumptions))
            blockers.Add("assumption");

        if (!HasConfirmedActor(document.ActorSet))
            blockers.Add("confirmed actor");

        if (!QualityAttributeMeetsMinimum(document.StructuredBrief.QualityAttribute))
            blockers.Add("quality attribute with a numeric target");

        return blockers;
    }

    public static void EnsureReviewReady(DraftRequestDocument document)
    {
        IReadOnlyList<string> blockers = EvaluateBlockers(document);

        if (blockers.Count == 0)
            return;

        throw new InvalidOperationException(
            $"Architecture draft is not ready to start a review. Add {string.Join(" and ", blockers)}.");
    }

    private static bool IsCreateArchitectureDraft(DraftRequestDocument document)
    {
        string? intent = document.WorkflowIntent?.Trim();

        return string.Equals(intent, ArchitectureWorkflowIntent.CreateArchitecture, StringComparison.OrdinalIgnoreCase);
    }

    private static bool ListHasConfirmedEntry(IReadOnlyList<string> items)
    {
        foreach (string item in items)
        {
            if (!string.IsNullOrWhiteSpace(item))
                return true;
        }

        return false;
    }

    private static bool HasConfirmedActor(ActorSet actorSet)
    {
        ArgumentNullException.ThrowIfNull(actorSet);

        foreach (ActorDescriptor actor in actorSet.Actors)
        {
            if (actor.Origin == ActorOrigin.Asserted)
                return true;
        }

        return false;
    }

    private static bool QualityAttributeMeetsMinimum(string? qualityAttribute)
    {
        if (string.IsNullOrWhiteSpace(qualityAttribute))
            return false;

        return NumericTokenPattern().IsMatch(qualityAttribute.Trim());
    }
}
