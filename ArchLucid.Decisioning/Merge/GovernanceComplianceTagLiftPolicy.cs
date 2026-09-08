using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Decisioning.Findings;

namespace ArchLucid.Decisioning.Merge;

/// <summary>
///     TB-1196 / DR-15: lifts <see cref="ManifestGovernance.ComplianceTags" /> only from pack rule ids — never from
///     agent finding <see cref="ArchitectureFinding.Message" /> prose.
/// </summary>
public static class GovernanceComplianceTagLiftPolicy
{
    public static void Apply(
        GoldenManifest manifest,
        ArchitectureFinding finding,
        AgentResult result,
        DecisionMergeResult output)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(result);
        ArgumentNullException.ThrowIfNull(output);

        if (!string.Equals(finding.Category, "Compliance", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        if (!AgentArchitectureFindingEmissionGate.HasTypedEmission(finding))
        {
            return;
        }

        string? policyRuleId = finding.PolicyRuleId?.Trim();

        if (!string.IsNullOrWhiteSpace(policyRuleId))
        {
            AddComplianceTag(manifest, policyRuleId, output, result, finding);

            return;
        }

        if (!string.IsNullOrWhiteSpace(finding.Message))
        {
            QuarantineProseTagCandidate(result, finding, output);
        }
    }

    private static void AddComplianceTag(
        GoldenManifest manifest,
        string policyRuleId,
        DecisionMergeResult output,
        AgentResult result,
        ArchitectureFinding finding)
    {
        if (!manifest.Governance.ComplianceTags.Contains(policyRuleId, StringComparer.OrdinalIgnoreCase))
        {
            manifest.Governance.ComplianceTags.Add(policyRuleId);

            DecisionMergeTraceRecorder.AddTrace(
                output,
                manifest.RunId,
                "ComplianceTagLifted",
                $"Lifted compliance tag '{policyRuleId}' from pack rule on {result.AgentType}.",
                new Dictionary<string, string>
                {
                    ["policyRuleId"] = policyRuleId,
                    ["findingId"] = finding.FindingId,
                    ["agentType"] = result.AgentType.ToString(),
                });
        }
    }

    private static void QuarantineProseTagCandidate(
        AgentResult result,
        ArchitectureFinding finding,
        DecisionMergeResult output)
    {
        result.WithheldFindings.Add(WithheldFindingSummaryMapper.FromQuarantinedComplianceTagProse(finding, result));

        DecisionMergeTraceRecorder.AddTrace(
            output,
            result.RunId,
            "ComplianceTagProseQuarantined",
            $"Quarantined compliance tag candidate from {result.AgentType} finding prose — pack rule id required.",
            new Dictionary<string, string>
            {
                ["findingId"] = finding.FindingId,
                ["agentType"] = result.AgentType.ToString(),
                ["category"] = finding.Category,
            });
    }
}
