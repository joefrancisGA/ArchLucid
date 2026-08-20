using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.PolicyPackBeforeAfterDiff;
using ArchLucid.Contracts.Compliance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Decisioning.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PolicyPackBeforeAfterConfigurationSnapshotBuilderTests
{
    [Fact]
    public void Build_marks_only_gate_blocking_findings_as_blocking_under_configuration()
    {
        List<Finding> findings =
        [
            new Finding
            {
                FindingId = "f-advisory-critical",
                FindingType = "Compliance",
                Category = "Compliance",
                EngineType = "Compliance",
                Severity = FindingSeverity.Critical,
                Title = "Generic WAF guidance",
                Rationale = "Generic WAF guidance",
                EnforcementTier = FindingEnforcementTier.Advisory,
            },
            new Finding
            {
                FindingId = "f-blocking",
                FindingType = "Compliance",
                Category = "Compliance",
                EngineType = "Compliance",
                Severity = FindingSeverity.Critical,
                Title = "Custom policy breach",
                Rationale = "Custom policy breach",
                EnforcementTier = FindingEnforcementTier.PolicyViolation,
            },
        ];

        PreCommitGateResult gate = PreCommitGateEvaluator.Evaluate(
            findings,
            blockCommitOnCritical: true,
            blockCommitMinimumSeverity: (int)FindingSeverity.Critical,
            policyPackIdLabel: "pack-test",
            warnOnlySeverities: null);

        gate.Blocked.Should().BeTrue();
        gate.BlockingFindingIds.Should().ContainSingle().Which.Should().Be("f-blocking");

        PolicyPackBeforeAfterConfiguration configuration = new()
        {
            Label = "Strict critical block",
            Content = new PolicyPackContentDocument(),
            BlockCommitOnCritical = true,
            BlockCommitMinimumSeverity = (int)FindingSeverity.Critical,
        };

        PolicyPackBeforeAfterConfigurationSnapshot snapshot =
            PolicyPackBeforeAfterConfigurationSnapshotBuilder.Build(
                configuration,
                new ComplianceRulePack { RulePackId = "demo", Name = "demo", Version = "1.0.0" },
                findings,
                gate);

        snapshot.Findings.Single(line => line.FindingId == "f-advisory-critical").BlocksCommitUnderConfiguration
            .Should()
            .BeFalse();

        snapshot.Findings.Single(line => line.FindingId == "f-blocking").BlocksCommitUnderConfiguration
            .Should()
            .BeTrue();
    }
}
