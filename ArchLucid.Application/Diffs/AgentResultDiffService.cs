using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.Diffs;

/// <summary>
///     Compares two sets of <see cref="AgentResult" /> objects (one per run) and produces a per-agent-type diff
///     covering claims, findings, evidence references, required controls, and warnings.
/// </summary>
public sealed class AgentResultDiffService(ICrossReviewFindingCorrelationService crossReviewFindingCorrelationService)
    : IAgentResultDiffService
{
    private readonly ICrossReviewFindingCorrelationService _crossReviewFindingCorrelationService =
        crossReviewFindingCorrelationService ?? throw new ArgumentNullException(nameof(crossReviewFindingCorrelationService));

    /// <summary>
    ///     Produces an <see cref="AgentResultDiffResult" /> describing the differences between the latest
    ///     result for each agent type across the two runs.
    /// </summary>
    public AgentResultDiffResult Compare(
        string leftRunId,
        IReadOnlyCollection<AgentResult> leftResults,
        string rightRunId,
        IReadOnlyCollection<AgentResult> rightResults)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(leftRunId);
        ArgumentException.ThrowIfNullOrWhiteSpace(rightRunId);
        ArgumentNullException.ThrowIfNull(leftResults);
        ArgumentNullException.ThrowIfNull(rightResults);

        AgentResultDiffResult result = new() { LeftRunId = leftRunId, RightRunId = rightRunId };

        List<AgentType> allAgentTypes = leftResults.Select(r => r.AgentType)
            .Union(rightResults.Select(r => r.AgentType))
            .Distinct()
            .OrderBy(x => x)
            .ToList();

        foreach (AgentType agentType in allAgentTypes)
        {
            AgentResult? left = leftResults
                .Where(r => r.AgentType == agentType)
                .OrderByDescending(r => r.CreatedUtc)
                .FirstOrDefault();

            AgentResult? right = rightResults
                .Where(r => r.AgentType == agentType)
                .OrderByDescending(r => r.CreatedUtc)
                .FirstOrDefault();

            result.AgentDeltas.Add(BuildDelta(agentType, left, right, _crossReviewFindingCorrelationService));
        }

        if (result.AgentDeltas.Count == 0)

            result.Warnings.Add("No agent results were available to compare.");

        return result;
    }

    /// <summary>
    ///     Builds the per-agent-type delta by diffing claims, evidence refs, findings, required controls, and warnings.
    /// </summary>
    private static AgentResultDelta BuildDelta(
        AgentType agentType,
        AgentResult? left,
        AgentResult? right,
        ICrossReviewFindingCorrelationService crossReviewFindingCorrelationService)
    {
        AgentResultDelta delta = new()
        {
            AgentType = agentType,
            LeftExists = left is not null,
            RightExists = right is not null,
            LeftConfidence = left?.Confidence,
            RightConfidence = right?.Confidence
        };

        List<string> leftClaims = left?.Claims ?? [];
        List<string> rightClaims = right?.Claims ?? [];

        List<string> leftEvidence = left?.EvidenceRefs ?? [];
        List<string> rightEvidence = right?.EvidenceRefs ?? [];

        List<string> leftControls = left?.ProposedChanges?.RequiredControls ?? [];
        List<string> rightControls = right?.ProposedChanges?.RequiredControls ?? [];

        List<string> leftWarnings = left?.ProposedChanges?.Warnings ?? [];
        List<string> rightWarnings = right?.ProposedChanges?.Warnings ?? [];

        delta.AddedClaims = Except(rightClaims, leftClaims);
        delta.RemovedClaims = Except(leftClaims, rightClaims);

        delta.AddedEvidenceRefs = Except(rightEvidence, leftEvidence);
        delta.RemovedEvidenceRefs = Except(leftEvidence, rightEvidence);

        (delta.AddedFindings, delta.RemovedFindings) = DiffFindings(
            left?.Findings,
            right?.Findings,
            crossReviewFindingCorrelationService);

        delta.AddedRequiredControls = Except(rightControls, leftControls);
        delta.RemovedRequiredControls = Except(leftControls, rightControls);

        delta.AddedWarnings = Except(rightWarnings, leftWarnings);
        delta.RemovedWarnings = Except(leftWarnings, rightWarnings);

        return delta;
    }

    /// <summary>
    ///     ADR 0063: correlate findings by policy-rule fingerprint or fuzzy category/message before surfacing add/remove.
    /// </summary>
    private static (List<string> Added, List<string> Removed) DiffFindings(
        IReadOnlyList<ArchitectureFinding>? leftFindings,
        IReadOnlyList<ArchitectureFinding>? rightFindings,
        ICrossReviewFindingCorrelationService crossReviewFindingCorrelationService)
    {
        IReadOnlyList<ArchitectureFinding> left = leftFindings ?? Array.Empty<ArchitectureFinding>();
        IReadOnlyList<ArchitectureFinding> right = rightFindings ?? Array.Empty<ArchitectureFinding>();

        List<ArchitectureFinding> leftWithIds = left
            .Where(static finding => !string.IsNullOrWhiteSpace(finding.FindingId))
            .ToList();

        List<ArchitectureFinding> rightWithIds = right
            .Where(static finding => !string.IsNullOrWhiteSpace(finding.FindingId))
            .ToList();

        CrossReviewFindingCorrelationResult correlation =
            crossReviewFindingCorrelationService.Correlate(leftWithIds, rightWithIds);

        HashSet<string> unmatchedLeftIds = correlation.UnmatchedLeftFindingIds
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        HashSet<string> unmatchedRightIds = correlation.UnmatchedRightFindingIds
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        List<string> removed = SelectUnmatchedFindingMessages(leftWithIds, unmatchedLeftIds, right);
        List<string> added = SelectUnmatchedFindingMessages(rightWithIds, unmatchedRightIds, left);

        // Findings without stable ids still use message-only comparison.
        List<string> leftMessagesWithoutId = SelectFindingMessagesWithoutId(left);
        List<string> rightMessagesWithoutId = SelectFindingMessagesWithoutId(right);

        removed.AddRange(Except(leftMessagesWithoutId, rightMessagesWithoutId));
        added.AddRange(Except(rightMessagesWithoutId, leftMessagesWithoutId));

        return (
            added.Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(static message => message).ToList(),
            removed.Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(static message => message).ToList());
    }

    private static List<string> SelectUnmatchedFindingMessages(
        IReadOnlyList<ArchitectureFinding> sideFindings,
        HashSet<string> unmatchedFindingIds,
        IReadOnlyList<ArchitectureFinding> oppositeSideFindings)
    {
        HashSet<string> oppositeMessages = oppositeSideFindings
            .Select(FormatFindingMessage)
            .Where(static message => !string.IsNullOrWhiteSpace(message))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        return sideFindings
            .Where(finding => unmatchedFindingIds.Contains(finding.FindingId))
            .Select(FormatFindingMessage)
            .Where(message => !string.IsNullOrWhiteSpace(message))
            .Where(message => !oppositeMessages.Contains(message))
            .ToList();
    }

    private static List<string> SelectFindingMessagesWithoutId(IReadOnlyList<ArchitectureFinding> findings)
    {
        return findings
            .Where(static finding => string.IsNullOrWhiteSpace(finding.FindingId))
            .Select(FormatFindingMessage)
            .Where(static message => !string.IsNullOrWhiteSpace(message))
            .ToList();
    }

    private static string FormatFindingMessage(ArchitectureFinding finding) => finding.Message;

    private static List<string> Except(
        IReadOnlyCollection<string> left,
        IReadOnlyCollection<string> right)
    {
        HashSet<string> rightSet = right.ToHashSet(StringComparer.OrdinalIgnoreCase);

        return left
            .Where(x => !rightSet.Contains(x))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(x => x)
            .ToList();
    }
}
