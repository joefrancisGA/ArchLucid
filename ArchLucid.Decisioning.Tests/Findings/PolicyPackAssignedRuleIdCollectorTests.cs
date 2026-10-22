using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PolicyPackAssignedRuleIdCollectorTests
{
    [Fact]
    public void Collect_merges_compliance_keys_ids_and_curated_metadata()
    {
        PolicyPackContentDocument pack = new()
        {
            ComplianceRuleKeys = ["phi.minimization.intake", "  "],
            ComplianceRuleIds = [Guid.Parse("11111111-1111-1111-1111-111111111111")],
            Metadata = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["pack.curatedRules.v1"] = "{\"rules\":[{\"id\":\"curated-rule-1\"}]}",
            },
        };

        HashSet<string> ruleIds = PolicyPackAssignedRuleIdCollector.Collect(pack);

        ruleIds.Should().BeEquivalentTo(
            [
                "phi.minimization.intake",
                "11111111-1111-1111-1111-111111111111",
                "curated-rule-1",
            ],
            opts => opts.WithoutStrictOrdering());
    }

    [Fact]
    public void Collect_ignores_malformed_curated_metadata_json()
    {
        PolicyPackContentDocument pack = new()
        {
            ComplianceRuleKeys = ["still-valid"],
            Metadata = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["pack.curatedRules.v1"] = "{not-json",
            },
        };

        HashSet<string> ruleIds = PolicyPackAssignedRuleIdCollector.Collect(pack);

        ruleIds.Should().BeEquivalentTo(["still-valid"]);
    }
}