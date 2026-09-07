using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Decisioning.Merge;
using ArchLucid.Decisioning.Validation;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Merge;

[Trait("Category", "Unit")]
public sealed class GovernanceComplianceTagLiftPolicyTests
{
    [Fact]
    public void Apply_does_not_lift_compliance_tag_from_message_prose()
    {
        GoldenManifest manifest = CreateManifest();
        AgentResult result = CreateComplianceResult(
            message: "SOC 2",
            policyRuleId: null,
            evidenceRefs: ["evidence:pack-1"]);
        DecisionMergeResult output = new();

        GovernanceComplianceTagLiftPolicy.Apply(
            manifest,
            result.Findings[0],
            result,
            output);

        manifest.Governance.ComplianceTags.Should().BeEmpty();
        result.WithheldFindings.Should().ContainSingle();
        result.WithheldFindings[0].Reason.Should().Be(WithheldFindingReasons.ComplianceTagFromProse);
        output.DecisionTraces
            .OfType<RunEventTrace>()
            .Select(trace => trace.RunEvent.EventType)
            .Should()
            .Contain("ComplianceTagProseQuarantined");
    }

    [Fact]
    public void Apply_lifts_compliance_tag_from_policy_rule_id_not_message()
    {
        GoldenManifest manifest = CreateManifest();
        AgentResult result = CreateComplianceResult(
            message: "SOC 2 narrative prose",
            policyRuleId: "policy-pack-soc2-rule-1",
            evidenceRefs: ["evidence:pack-1"]);
        DecisionMergeResult output = new();

        GovernanceComplianceTagLiftPolicy.Apply(
            manifest,
            result.Findings[0],
            result,
            output);

        manifest.Governance.ComplianceTags.Should().ContainSingle("policy-pack-soc2-rule-1");
        manifest.Governance.ComplianceTags.Should().NotContain("SOC 2 narrative prose");
        result.WithheldFindings.Should().BeEmpty();
    }

    [Fact]
    public void MergeResults_soc2_message_without_policy_rule_does_not_add_compliance_tag()
    {
        DecisionEngineService service = new(new PassthroughSchemaValidationService());
        ArchitectureRequest request = new()
        {
            RequestId = "req-1",
            SystemName = "Sys",
            Description = "Long enough description for validation.",
            Environment = "prod",
        };

        AgentResult compliance = CreateComplianceResult(
            message: "SOC 2",
            policyRuleId: null,
            evidenceRefs: ["evidence:pack-1"]);
        compliance.RunId = "run-1";

        DecisionMergeResult merge = service.MergeResults(
            "run-1",
            request,
            "v1",
            [compliance],
            [],
            []);

        merge.Success.Should().BeTrue();
        merge.Manifest.Governance.ComplianceTags.Should().BeEmpty();
        compliance.WithheldFindings.Should().ContainSingle();
        compliance.WithheldFindings[0].Reason.Should().Be(WithheldFindingReasons.ComplianceTagFromProse);
    }

    private static GoldenManifest CreateManifest()
    {
        return new GoldenManifest
        {
            RunId = "run-1",
            SystemName = "Sys",
            Governance = new ManifestGovernance(),
        };
    }

    private static AgentResult CreateComplianceResult(
        string message,
        string? policyRuleId,
        IReadOnlyList<string>? evidenceRefs)
    {
        return new AgentResult
        {
            ResultId = "res-1",
            TaskId = "task-1",
            RunId = "run-1",
            AgentType = AgentType.Compliance,
            Confidence = 0.9,
            Claims = ["ok"],
            EvidenceRefs = ["run-level-evidence"],
            Findings =
            [
                new ArchitectureFinding
                {
                    FindingId = "finding-1",
                    Category = "Compliance",
                    Message = message,
                    PolicyRuleId = policyRuleId,
                    EvidenceRefs = evidenceRefs?.ToList() ?? [],
                },
            ],
        };
    }
}
