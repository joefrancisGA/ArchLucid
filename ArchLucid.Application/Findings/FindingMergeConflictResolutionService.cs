using System.Text.RegularExpressions;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Findings;

public interface IFindingMergeConflictResolutionService
{
    Task<FindingMergeConflictResolveResult> TryResolveAsync(
        ScopeContext scope,
        Guid runId,
        string conflictFindingId,
        FindingMergeConflictResolutionAction action,
        CancellationToken cancellationToken = default);
}

public sealed partial class FindingMergeConflictResolutionService(
    IRunRepository runRepository,
    IFindingsSnapshotRepository findingsSnapshotRepository) : IFindingMergeConflictResolutionService
{
    private const string ConflictFindingType = "FindingMergeConflict";
    private const string ResolvedConflictFindingType = "FindingMergeConflictResolved";
    private const string ConflictEngineType = "finding-merge-conflict";
    private const string ResolutionActionPropertyKey = "findingMerge.resolutionAction";
    private static readonly Regex MemberFindingIdsRegex = MemberFindingIdsPattern();

    public async Task<FindingMergeConflictResolveResult> TryResolveAsync(
        ScopeContext scope,
        Guid runId,
        string conflictFindingId,
        FindingMergeConflictResolutionAction action,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(conflictFindingId);

        RunRecord? run = await runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        if (run?.FindingsSnapshotId is not Guid snapshotId)
            return FindingMergeConflictResolveResult.NotFound;

        FindingsSnapshot? snapshot = await findingsSnapshotRepository
            .GetByIdAsync(scope, snapshotId, cancellationToken)
            .ConfigureAwait(false);

        if (snapshot?.Findings is not { Count: > 0 } findings)
            return FindingMergeConflictResolveResult.NotFound;

        Finding? existingConflictRow = findings
            .FirstOrDefault(finding =>
                string.Equals(finding.FindingId, conflictFindingId, StringComparison.OrdinalIgnoreCase));

        if (existingConflictRow is null)
            return FindingMergeConflictResolveResult.NotFound;

        if (string.Equals(existingConflictRow.FindingType, ResolvedConflictFindingType, StringComparison.Ordinal))
            return FindingMergeConflictResolveResult.AlreadyResolved;

        if (!string.Equals(existingConflictRow.FindingType, ConflictFindingType, StringComparison.Ordinal))
            return FindingMergeConflictResolveResult.NotFound;

        Finding conflictFinding = existingConflictRow;

        List<string> memberFindingIds = ExtractMemberFindingIds(conflictFinding);

        if (memberFindingIds.Count == 0)
            return FindingMergeConflictResolveResult.NotFound;

        List<Finding> members = findings
            .Where(finding => memberFindingIds.Contains(finding.FindingId ?? string.Empty, StringComparer.OrdinalIgnoreCase))
            .ToList();

        if (members.Count == 0)
            return FindingMergeConflictResolveResult.NotFound;

        Finding primary = members
            .OrderBy(static finding => finding.EngineType ?? string.Empty, StringComparer.Ordinal)
            .ThenBy(static finding => finding.FindingId ?? string.Empty, StringComparer.Ordinal)
            .First();

        HashSet<string> idsToRemove = new(StringComparer.Ordinal);

        if (action == FindingMergeConflictResolutionAction.AcceptPrimary)
        {
            foreach (Finding member in members)
            {
                if (!string.Equals(member.FindingId, primary.FindingId, StringComparison.Ordinal))
                    idsToRemove.Add(member.FindingId ?? string.Empty);
            }
        }
        else if (action == FindingMergeConflictResolutionAction.AcceptAlternate)
        {
            Finding alternate = members
                .FirstOrDefault(member => !string.Equals(member.FindingId, primary.FindingId, StringComparison.Ordinal))
                ?? primary;

            foreach (Finding member in members)
            {
                if (!string.Equals(member.FindingId, alternate.FindingId, StringComparison.Ordinal))
                    idsToRemove.Add(member.FindingId ?? string.Empty);
            }
        }

        List<Finding> updatedFindings = findings
            .Where(finding => !idsToRemove.Contains(finding.FindingId ?? string.Empty))
            .ToList();

        Finding? resolvedConflict = updatedFindings
            .FirstOrDefault(finding =>
                string.Equals(finding.FindingId, conflictFinding.FindingId, StringComparison.OrdinalIgnoreCase));

        if (resolvedConflict is null)
            return FindingMergeConflictResolveResult.NotFound;

        resolvedConflict.FindingType = ResolvedConflictFindingType;
        resolvedConflict.Properties ??= new Dictionary<string, string>(StringComparer.Ordinal);
        resolvedConflict.Properties[ResolutionActionPropertyKey] = action.ToString();

        snapshot.Findings = updatedFindings;

        snapshot.EngineFailures = snapshot.EngineFailures
            .Where(failure => !string.Equals(failure.EngineType, ConflictEngineType, StringComparison.Ordinal))
            .ToList();

        await findingsSnapshotRepository.SaveAsync(snapshot, cancellationToken).ConfigureAwait(false);

        return FindingMergeConflictResolveResult.Resolved;
    }

    private static List<string> ExtractMemberFindingIds(Finding conflictFinding)
    {
        string rationale = conflictFinding.Rationale ?? string.Empty;
        Match match = MemberFindingIdsRegex.Match(rationale);

        if (!match.Success)
            return [];

        return match.Groups[1].Value
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(static id => id.Length > 0)
            .Distinct(StringComparer.Ordinal)
            .ToList();
    }

    [GeneratedRegex(@"FindingIds=\[(.*?)\]", RegexOptions.CultureInvariant)]
    private static partial Regex MemberFindingIdsPattern();
}
