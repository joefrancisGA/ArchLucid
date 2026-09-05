using System.Text.RegularExpressions;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Findings;

public interface IFindingMergeConflictResolutionService
{
    Task<bool> TryResolveAsync(
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
    private const string ConflictEngineType = "finding-merge-conflict";
    private static readonly Regex MemberFindingIdsRegex = MemberFindingIdsPattern();

    public async Task<bool> TryResolveAsync(
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
            return false;

        FindingsSnapshot? snapshot = await findingsSnapshotRepository
            .GetByIdAsync(scope, snapshotId, cancellationToken)
            .ConfigureAwait(false);

        if (snapshot?.Findings is not { Count: > 0 } findings)
            return false;

        Finding? conflictFinding = findings
            .FirstOrDefault(finding =>
                string.Equals(finding.FindingId, conflictFindingId, StringComparison.OrdinalIgnoreCase)
                && string.Equals(finding.FindingType, ConflictFindingType, StringComparison.Ordinal));

        if (conflictFinding is null)
            return false;

        List<string> memberFindingIds = ExtractMemberFindingIds(conflictFinding);

        if (memberFindingIds.Count == 0)
            return false;

        List<Finding> members = findings
            .Where(finding => memberFindingIds.Contains(finding.FindingId ?? string.Empty, StringComparer.OrdinalIgnoreCase))
            .ToList();

        if (members.Count == 0)
            return false;

        Finding primary = members
            .OrderBy(static finding => finding.EngineType ?? string.Empty, StringComparer.Ordinal)
            .ThenBy(static finding => finding.FindingId ?? string.Empty, StringComparer.Ordinal)
            .First();

        HashSet<string> idsToRemove = new(StringComparer.Ordinal)
        {
            conflictFinding.FindingId ?? string.Empty,
        };

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

        snapshot.Findings = findings
            .Where(finding => !idsToRemove.Contains(finding.FindingId ?? string.Empty))
            .ToList();

        snapshot.EngineFailures = snapshot.EngineFailures
            .Where(failure => !string.Equals(failure.EngineType, ConflictEngineType, StringComparison.Ordinal))
            .ToList();

        await findingsSnapshotRepository.SaveAsync(snapshot, cancellationToken).ConfigureAwait(false);

        return true;
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
