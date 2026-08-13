namespace ArchLucid.Application.Governance.PolicyPackBeforeAfterDiff;

/// <summary>
///     Computes structured deltas between two configuration snapshots.
/// </summary>
public static class PolicyPackBeforeAfterDiffComposer
{
    public static PolicyPackBeforeAfterDiffChangeSet Compose(
        PolicyPackBeforeAfterConfigurationSnapshot before,
        PolicyPackBeforeAfterConfigurationSnapshot after)
    {
        ArgumentNullException.ThrowIfNull(before);
        ArgumentNullException.ThrowIfNull(after);

        HashSet<string> beforeRules = before.ActiveComplianceRuleKeysOrdered.ToHashSet(StringComparer.OrdinalIgnoreCase);
        HashSet<string> afterRules = after.ActiveComplianceRuleKeysOrdered.ToHashSet(StringComparer.OrdinalIgnoreCase);

        IReadOnlyList<string> addedRules = after.ActiveComplianceRuleKeysOrdered
            .Where(key => !beforeRules.Contains(key))
            .ToList();

        IReadOnlyList<string> removedRules = before.ActiveComplianceRuleKeysOrdered
            .Where(key => !afterRules.Contains(key))
            .ToList();

        HashSet<string> beforeBlocking = before.Findings
            .Where(line => line.BlocksCommitUnderConfiguration)
            .Select(line => line.FindingId)
            .ToHashSet(StringComparer.Ordinal);

        HashSet<string> afterBlocking = after.Findings
            .Where(line => line.BlocksCommitUnderConfiguration)
            .Select(line => line.FindingId)
            .ToHashSet(StringComparer.Ordinal);

        IReadOnlyList<string> newlyBlocking = afterBlocking
            .Where(id => !beforeBlocking.Contains(id))
            .OrderBy(id => id, StringComparer.Ordinal)
            .ToList();

        IReadOnlyList<string> noLongerBlocking = beforeBlocking
            .Where(id => !afterBlocking.Contains(id))
            .OrderBy(id => id, StringComparer.Ordinal)
            .ToList();

        HashSet<string> beforeExecutive = before.SponsorReportLines.ToHashSet(StringComparer.Ordinal);
        HashSet<string> afterExecutive = after.SponsorReportLines.ToHashSet(StringComparer.Ordinal);

        IReadOnlyList<string> executiveAdded = after.SponsorReportLines
            .Where(line => !beforeExecutive.Contains(line))
            .ToList();

        IReadOnlyList<string> executiveRemoved = before.SponsorReportLines
            .Where(line => !afterExecutive.Contains(line))
            .ToList();

        return new PolicyPackBeforeAfterDiffChangeSet
        {
            AddedComplianceRuleKeys = addedRules,
            RemovedComplianceRuleKeys = removedRules,
            FindingsNewlyBlockingCommit = newlyBlocking,
            FindingsNoLongerBlockingCommit = noLongerBlocking,
            SponsorReportLinesAdded = executiveAdded,
            SponsorReportLinesRemoved = executiveRemoved,
            GateBlockedFlipped = before.GateBlocked != after.GateBlocked,
        };
    }
}
