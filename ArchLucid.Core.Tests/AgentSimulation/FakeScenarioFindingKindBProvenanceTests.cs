using ArchLucid.Contracts.Findings;
using ArchLucid.Core.AgentSimulation;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AgentSimulation;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FakeScenarioFindingKindBProvenanceTests
{
    [Fact]
    public void Attach_sets_policy_rule_id_and_appends_policy_rule_ref()
    {
        ArchitectureFinding finding = new()
        {
            Message = "cost",
            EvidenceRefs = ["pricing-profile"],
        };

        ArchitectureFinding attached = FakeScenarioFindingKindBProvenance.Attach(
            finding,
            FakeScenarioFindingKindBProvenance.ManagedServicesCostRuleId);

        attached.PolicyRuleId.Should().Be(FakeScenarioFindingKindBProvenance.ManagedServicesCostRuleId);
        attached.EvidenceRefs.Should().Equal(
            "pricing-profile",
            $"policy-rule:{FakeScenarioFindingKindBProvenance.ManagedServicesCostRuleId}");
    }

    [Fact]
    public void Attach_does_not_duplicate_existing_policy_rule_ref()
    {
        string policyRef = $"policy-rule:{FakeScenarioFindingKindBProvenance.KeyVaultSecretsRuleId}";
        ArchitectureFinding finding = new()
        {
            EvidenceRefs = [policyRef],
        };

        FakeScenarioFindingKindBProvenance.Attach(
            finding,
            FakeScenarioFindingKindBProvenance.KeyVaultSecretsRuleId);

        finding.EvidenceRefs.Should().Equal(policyRef);
    }

    [Fact]
    public void Attach_throws_when_finding_is_null()
    {
        Action act = () => FakeScenarioFindingKindBProvenance.Attach(
            null!,
            FakeScenarioFindingKindBProvenance.KeyVaultSecretsRuleId);

        act.Should().Throw<ArgumentNullException>().WithParameterName("finding");
    }

    [Fact]
    public void Attach_throws_when_policy_rule_id_is_blank()
    {
        Action act = () => FakeScenarioFindingKindBProvenance.Attach(new ArchitectureFinding(), "  ");

        act.Should().Throw<ArgumentException>().WithParameterName("policyRuleId");
    }
}
