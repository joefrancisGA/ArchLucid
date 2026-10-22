using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>L0 MUST framing gates review-complete sealing until all framing questions are answered (TB-2341 item 47).</summary>
public static class ArchitectureFramingMustGate
{
    public const string PublishBlockReason =
        "L0 framing incomplete: review cannot be sealed until MUST questions are answered.";

    public static TrustPublishDecision MergeFramingIncompletePublishBlock(
        ProgressiveInterviewState interview,
        TrustPublishDecision publishDecision)
    {
        ArgumentNullException.ThrowIfNull(interview);
        ArgumentNullException.ThrowIfNull(publishDecision);

        if (interview.IsFramingComplete)
        {
            return publishDecision;
        }

        List<string> blockReasons = publishDecision.BlockReasons.ToList();

        if (!blockReasons.Contains(PublishBlockReason, StringComparer.Ordinal))
        {
            blockReasons.Add(PublishBlockReason);
        }

        return new TrustPublishDecision
        {
            PublishableFindings = [],
            PublishableRecommendations = [],
            IntegrityPassedFindingIds = publishDecision.IntegrityPassedFindingIds,
            PublishBlocked = true,
            BlockReasons = blockReasons,
        };
    }
}
