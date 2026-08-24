using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Application.Drafts;

/// <summary>Fail-closed review-start readiness for architecture drafts (TB-2282).</summary>
public static class ArchitectureDraftReviewReadinessValidator
{
    private const int MinimumOutcomeLength = 10;

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

        if (!HasConfirmedActor(document.ActorSet))
            blockers.Add("confirmed actor");

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
}
