using ArchLucid.Contracts.Compliance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Application.Governance.PolicyPackBeforeAfterDiff;

/// <summary>
///     Builds a configuration snapshot from pack content, committed findings, and a pre-commit gate evaluation.
/// </summary>
public static class PolicyPackBeforeAfterConfigurationSnapshotBuilder
{
    public static PolicyPackBeforeAfterConfigurationSnapshot Build(
        PolicyPackBeforeAfterConfiguration configuration,
        ComplianceRulePack sourceRulePack,
        IReadOnlyList<Finding> committedFindings,
        PreCommitGateResult gateResult)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(sourceRulePack);
        ArgumentNullException.ThrowIfNull(committedFindings);
        ArgumentNullException.ThrowIfNull(gateResult);

        ComplianceRulePack filtered = ComplianceRulePackGovernanceFilter.Filter(sourceRulePack, configuration.Content);
        string priorityFloor = PolicyPackPriorityFloor.ResolveFloor(configuration.Content);

        IReadOnlyList<string> activeRuleKeys = filtered.Rules
            .OrderBy(rule => RulePriorityRank(rule.Priority))
            .ThenBy(rule => rule.RuleId, StringComparer.Ordinal)
            .Select(rule => rule.RuleId)
            .ToList();

        HashSet<string> blockingFindingIds = gateResult.Blocked
            ? gateResult.BlockingFindingIds.ToHashSet(StringComparer.Ordinal)
            : [];

        IReadOnlyList<PolicyPackBeforeAfterFindingLine> findingLines = committedFindings
            .OrderByDescending(finding => (int)finding.Severity)
            .ThenBy(finding => finding.FindingId, StringComparer.Ordinal)
            .Select(finding => new PolicyPackBeforeAfterFindingLine
            {
                FindingId = finding.FindingId,
                Severity = finding.Severity.ToString(),
                Title = finding.Title,
                BlocksCommitUnderConfiguration = blockingFindingIds.Contains(finding.FindingId),
            })
            .ToList();

        IReadOnlyList<string> SponsorReportLines =
        [
            $"Pre-commit gate: {(gateResult.Blocked ? "blocked" : "allowed")} (commit would {(gateResult.Blocked ? "not proceed" : "proceed")})",
            $"Active compliance rules ({activeRuleKeys.Count}, priority floor {priorityFloor}): {string.Join(", ", activeRuleKeys)}",
            $"Committed findings in scope ({findingLines.Count}): {string.Join(", ", findingLines.Select(line => $"{line.FindingId} ({line.Severity})"))}",
            $"Enforcement: blockCommitOnCritical={configuration.BlockCommitOnCritical}, blockCommitMinimumSeverity={FormatMinimumSeverity(configuration.BlockCommitMinimumSeverity)}",
        ];

        return new PolicyPackBeforeAfterConfigurationSnapshot
        {
            ConfigurationLabel = configuration.Label,
            PriorityFloor = priorityFloor,
            ActiveComplianceRuleKeysOrdered = activeRuleKeys,
            Findings = findingLines,
            GateBlocked = gateResult.Blocked,
            SponsorReportLines = SponsorReportLines,
        };
    }

    private static int RulePriorityRank(string? priority)
    {
        if (string.IsNullOrWhiteSpace(priority))
            return 1;

        string normalized = priority.Trim().ToUpperInvariant();

        if (normalized is "P0" or "0")
            return 0;

        if (normalized is "P2" or "2")
            return 2;

        return 1;
    }

    private static string FormatMinimumSeverity(int? minimum) =>
        minimum.HasValue ? minimum.Value.ToString() : "null";
}
