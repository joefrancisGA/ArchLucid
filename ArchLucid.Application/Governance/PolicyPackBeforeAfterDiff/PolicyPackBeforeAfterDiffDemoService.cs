using ArchLucid.Contracts.Compliance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Application.Governance.PolicyPackBeforeAfterDiff;

/// <summary>
///     Orchestrates a deterministic policy-pack before/after demo on one committed run using governance dry-run only.
/// </summary>
public sealed class PolicyPackBeforeAfterDiffDemoService
{
    public PolicyPackBeforeAfterDiffArtifact BuildArtifact(
        string demoLabel,
        string runId,
        ComplianceRulePack sourceRulePack,
        IReadOnlyList<Finding> committedFindings,
        PolicyPackBeforeAfterConfiguration beforeConfiguration,
        PreCommitGateResult beforeGate,
        PolicyPackBeforeAfterConfiguration afterConfiguration,
        PreCommitGateResult afterGate,
        IReadOnlyList<PolicyPackBeforeAfterAuditCitation> auditTrailCitations)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(demoLabel);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(sourceRulePack);
        ArgumentNullException.ThrowIfNull(committedFindings);
        ArgumentNullException.ThrowIfNull(beforeConfiguration);
        ArgumentNullException.ThrowIfNull(beforeGate);
        ArgumentNullException.ThrowIfNull(afterConfiguration);
        ArgumentNullException.ThrowIfNull(afterGate);
        ArgumentNullException.ThrowIfNull(auditTrailCitations);

        PolicyPackBeforeAfterConfigurationSnapshot beforeSnapshot = PolicyPackBeforeAfterConfigurationSnapshotBuilder.Build(
            beforeConfiguration,
            sourceRulePack,
            committedFindings,
            beforeGate);

        PolicyPackBeforeAfterConfigurationSnapshot afterSnapshot = PolicyPackBeforeAfterConfigurationSnapshotBuilder.Build(
            afterConfiguration,
            sourceRulePack,
            committedFindings,
            afterGate);

        PolicyPackBeforeAfterDiffChangeSet changes = PolicyPackBeforeAfterDiffComposer.Compose(beforeSnapshot, afterSnapshot);

        return new PolicyPackBeforeAfterDiffArtifact
        {
            DemoLabel = demoLabel,
            RunId = runId,
            Before = beforeSnapshot,
            After = afterSnapshot,
            Changes = changes,
            AuditTrailCitations = auditTrailCitations,
        };
    }

    /// <summary>
    ///     Convenience helper for the canonical synthetic fixture: default allow-path vs strict block-path.
    /// </summary>
    public PolicyPackBeforeAfterDiffArtifact BuildSyntheticFixtureArtifact(
        string runId,
        IReadOnlyList<Finding> committedFindings,
        PreCommitGateResult defaultGate,
        PreCommitGateResult strictGate,
        IReadOnlyList<PolicyPackBeforeAfterAuditCitation> auditTrailCitations) =>
        BuildArtifact(
            "policy-ab-demo (synthetic - internal demo validation only)",
            runId,
            BuildSyntheticSourceRulePack(),
            committedFindings,
            new PolicyPackBeforeAfterConfiguration
            {
                Label = "Configuration A — default pack (allow path)",
                Content = BuildSyntheticDefaultContent(),
                BlockCommitOnCritical = false,
                BlockCommitMinimumSeverity = null,
            },
            defaultGate,
            new PolicyPackBeforeAfterConfiguration
            {
                Label = "Configuration B — strict pack (block path)",
                Content = BuildSyntheticStrictContent(),
                BlockCommitOnCritical = true,
                BlockCommitMinimumSeverity = (int)FindingSeverity.Critical,
            },
            strictGate,
            auditTrailCitations);

    private static ComplianceRulePack BuildSyntheticSourceRulePack() =>
        new()
        {
            RulePackId = "policy-ab-demo-pack",
            Name = "Policy A/B demo pack (synthetic)",
            Version = "1.0.0",
            Rules =
            [
                DemoRule("demo-ctrl-encryption-at-rest", PolicyPackRulePriority.P0),
                DemoRule("demo-ctrl-audit-logging", PolicyPackRulePriority.P0),
                DemoRule("demo-ctrl-network-isolation", PolicyPackRulePriority.P1),
                DemoRule("demo-ctrl-not-selected", PolicyPackRulePriority.P2),
            ],
        };

    private static PolicyPackContentDocument BuildSyntheticDefaultContent() =>
        BuildSyntheticContent(["demo-ctrl-encryption-at-rest", "demo-ctrl-audit-logging"], PolicyPackRulePriority.P0);

    private static PolicyPackContentDocument BuildSyntheticStrictContent() =>
        BuildSyntheticContent(
            ["demo-ctrl-encryption-at-rest", "demo-ctrl-audit-logging", "demo-ctrl-network-isolation"],
            PolicyPackRulePriority.P1);

    private static PolicyPackContentDocument BuildSyntheticContent(IReadOnlyList<string> keys, string priorityFloor)
    {
        PolicyPackContentDocument content = new()
        {
            ComplianceRuleKeys = keys.ToList(),
        };

        content.AdvisoryDefaults[PolicyPackRulePriority.AdvisoryDefaultsKey] = priorityFloor;
        content.Metadata["governance.demoFixture"] = "policy-ab-demo (synthetic - internal demo validation only)";

        return content;
    }

    private static ComplianceRule DemoRule(string ruleId, string priority) =>
        new()
        {
            RuleId = ruleId,
            ControlId = ruleId,
            ControlName = ruleId,
            AppliesToCategory = "Compliance",
            RequiredNodeType = "Service",
            RequiredEdgeType = "DependsOn",
            Description = $"Demo rule {ruleId} (synthetic).",
            Priority = priority,
        };
}
