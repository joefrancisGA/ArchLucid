using ArchLucid.Persistence.Findings;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingInspectReadRepositoryCoreTests
{
    [Fact]
    public void ResolveRuleFields_prefers_applied_rule_ids_json()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            "[\"rule-1\"]",
            "trace-text");

        ruleId.Should().Be("rule-1");
        ruleName.Should().Be("rule-1");
    }

    [Fact]
    public void BuildMetadataTypedPayload_returns_null_when_empty()
    {
        FindingInspectReadRepositoryCore.BuildMetadataTypedPayload(null, null).Should().BeNull();
    }
}
