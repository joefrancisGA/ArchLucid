using System.Text.Json;

using ArchLucid.Application.Governance.PolicyPackBeforeAfterDiff;
using ArchLucid.Contracts.Compliance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Application.Governance.PolicyPackCompoundingEvidenceLedger;

/// <summary>
///     Builds a TB-885 compounding ledger by dry-running older vs newer pack content on one historical run.
/// </summary>
public sealed class PolicyPackCompoundingEvidenceLedgerBuilder
{
    private readonly PolicyPackBeforeAfterDiffDemoService _beforeAfterDiffDemoService = new();

    public PolicyPackCompoundingEvidenceLedger Build(
        Guid policyPackId,
        string runId,
        string olderVersionLabel,
        string olderContentJson,
        PreCommitGateResult olderGate,
        string newerVersionLabel,
        string newerContentJson,
        PreCommitGateResult newerGate,
        ComplianceRulePack sourceRulePack,
        IReadOnlyList<Finding> committedFindings,
        IReadOnlyList<PolicyPackCompoundingEvidenceChangeLogCitation> changeLogCitations)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(olderVersionLabel);
        ArgumentException.ThrowIfNullOrWhiteSpace(olderContentJson);
        ArgumentException.ThrowIfNullOrWhiteSpace(newerVersionLabel);
        ArgumentException.ThrowIfNullOrWhiteSpace(newerContentJson);
        ArgumentNullException.ThrowIfNull(olderGate);
        ArgumentNullException.ThrowIfNull(newerGate);
        ArgumentNullException.ThrowIfNull(sourceRulePack);
        ArgumentNullException.ThrowIfNull(committedFindings);
        ArgumentNullException.ThrowIfNull(changeLogCitations);

        PolicyPackContentDocument olderContent = DeserializeContent(olderContentJson);
        PolicyPackContentDocument newerContent = DeserializeContent(newerContentJson);
        (bool olderBlockCritical, int? olderMinSeverity) = ResolveEnforcement(olderContent);
        (bool newerBlockCritical, int? newerMinSeverity) = ResolveEnforcement(newerContent);

        PolicyPackBeforeAfterDiffArtifact artifact = _beforeAfterDiffDemoService.BuildArtifact(
            $"policy-pack compounding ledger ({policyPackId:D})",
            runId,
            sourceRulePack,
            committedFindings,
            new PolicyPackBeforeAfterConfiguration
            {
                Label = $"Version {olderVersionLabel} (older)",
                Content = olderContent,
                BlockCommitOnCritical = olderBlockCritical,
                BlockCommitMinimumSeverity = olderMinSeverity,
            },
            olderGate,
            new PolicyPackBeforeAfterConfiguration
            {
                Label = $"Version {newerVersionLabel} (current)",
                Content = newerContent,
                BlockCommitOnCritical = newerBlockCritical,
                BlockCommitMinimumSeverity = newerMinSeverity,
            },
            newerGate,
            []);

        return new PolicyPackCompoundingEvidenceLedger
        {
            Schema = PolicyPackCompoundingEvidenceLedger.SchemaId,
            GeneratedUtc = TimeProvider.System.UtcNowDateTime(),
            PolicyPackId = policyPackId,
            RunId = runId,
            OlderVersionLabel = olderVersionLabel,
            NewerVersionLabel = newerVersionLabel,
            OlderGateBlocked = artifact.Before.GateBlocked,
            NewerGateBlocked = artifact.After.GateBlocked,
            IncrementalCatch = artifact.Changes,
            ChangeLogCitations = changeLogCitations,
            ClaimBoundaryText = PolicyPackCompoundingEvidenceLedger.ClaimBoundary,
        };
    }

    public PolicyPackCompoundingEvidenceLedger BuildFromChangeLogTransition(
        Guid policyPackId,
        string runId,
        PolicyPackChangeLogVersionPairSelector.VersionTransition transition,
        ComplianceRulePack sourceRulePack,
        IReadOnlyList<Finding> committedFindings,
        PreCommitGateResult olderGate,
        PreCommitGateResult newerGate)
    {
        ArgumentNullException.ThrowIfNull(transition);

        List<PolicyPackCompoundingEvidenceChangeLogCitation> citations =
        [
            ToCitation(transition.NewerChangeLogEntry),
        ];

        if (transition.OlderChangeLogEntry is not null)
            citations.Add(ToCitation(transition.OlderChangeLogEntry));

        return Build(
            policyPackId,
            runId,
            transition.OlderVersionLabel,
            transition.OlderContentJson,
            olderGate,
            transition.NewerVersionLabel,
            transition.NewerContentJson,
            newerGate,
            sourceRulePack,
            committedFindings,
            citations);
    }

    private static PolicyPackCompoundingEvidenceChangeLogCitation ToCitation(PolicyPackChangeLogEntry entry) =>
        new()
        {
            ChangeLogId = entry.ChangeLogId,
            ChangeType = entry.ChangeType,
            SummaryText = entry.SummaryText ?? string.Empty,
            ChangedUtc = entry.ChangedUtc,
        };

    private static PolicyPackContentDocument DeserializeContent(string contentJson) =>
        JsonSerializer.Deserialize<PolicyPackContentDocument>(
            contentJson,
            Decisioning.Governance.PolicyPacks.PolicyPackJsonSerializerOptions.Default)
        ?? new PolicyPackContentDocument();

    private static (bool BlockCommitOnCritical, int? BlockCommitMinimumSeverity) ResolveEnforcement(
        PolicyPackContentDocument content)
    {
        bool? blockCritical = TryReadNullableBool(content.Metadata, ["governance.blockCommitOnCritical", "blockCommitOnCritical"]);
        int? minimumSeverity = TryReadNullableInt(content.Metadata, ["governance.blockCommitMinimumSeverity", "blockCommitMinimumSeverity"]);

        return (blockCritical ?? false, minimumSeverity);
    }

    private static bool? TryReadNullableBool(IReadOnlyDictionary<string, string> metadata, string[] keys)
    {
        foreach (string key in keys)
        {
            if (!PolicyPackContentMetadataReader.TryGetValue(metadata, key, out string? raw) || string.IsNullOrWhiteSpace(raw))
                continue;

            if (bool.TryParse(raw.Trim(), out bool booleanValue))
                return booleanValue;

            if (int.TryParse(raw.Trim(), out int integerValue))
            {
                if (integerValue == 1)
                    return true;

                if (integerValue == 0)
                    return false;
            }

            if (string.Equals(raw.Trim(), "yes", StringComparison.OrdinalIgnoreCase))
                return true;

            if (string.Equals(raw.Trim(), "no", StringComparison.OrdinalIgnoreCase))
                return false;
        }

        return null;
    }

    private static int? TryReadNullableInt(IReadOnlyDictionary<string, string> metadata, string[] keys)
    {
        foreach (string key in keys)
        {
            if (!PolicyPackContentMetadataReader.TryGetValue(metadata, key, out string? raw) || string.IsNullOrWhiteSpace(raw))
                continue;

            if (int.TryParse(raw.Trim(), out int value))
                return value;
        }

        return null;
    }
}
