using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Decisioning.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PreCommitGateEvaluatorTests
{
    [Fact]
    public void Evaluate_ignores_advisory_findings_when_blocking_on_critical()
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

        PreCommitGateResult result = PreCommitGateEvaluator.Evaluate(
            findings,
            blockCommitOnCritical: true,
            blockCommitMinimumSeverity: (int)FindingSeverity.Critical,
            policyPackIdLabel: "pack-test",
            warnOnlySeverities: null);

        result.Blocked.Should().BeTrue();
        result.BlockingFindingIds.Should().ContainSingle().Which.Should().Be("f-blocking");
    }
}
