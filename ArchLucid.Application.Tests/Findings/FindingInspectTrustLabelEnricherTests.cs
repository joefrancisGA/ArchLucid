using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingInspectTrustLabelEnricherTests
{
    [Fact]
    public void Enrich_SetsTrustLabelForPolicyRuleFinding()
    {
        FindingInspectResponse response = new()
        {
            FindingId = "f-1",
            DecisionRuleId = "rule-1",
            Evidence = [],
        };

        FindingInspectResponse enriched = FindingInspectTrustLabelEnricher.Enrich(response, new FindingTrustLabelMapper());

        enriched.TrustLabel.Should().Be(nameof(FindingTrustLabel.DeterministicRule));
        enriched.TrustLabelReason.Should().Contain("deterministic policy rule");
    }
}
