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
    public void ResolveRuleFields_when_applied_rule_ids_present_keeps_decision_rule_name_aligned_with_first_id()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            """["cost-guardrail"]""",
            firstRuleText: "Encrypt data at rest");

        ruleId.Should().Be("cost-guardrail");
        ruleName.Should().Be("cost-guardrail");
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_missing_uses_first_trace_rule_text_for_both_fields()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            appliedRuleIdsJson: null,
            firstRuleText: "Encrypt data at rest");

        ruleId.Should().Be("Encrypt data at rest");
        ruleName.Should().Be("Encrypt data at rest");
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_json_contains_null_element_falls_back_to_trace_text()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            "[null]",
            firstRuleText: "Encrypt data at rest");

        ruleId.Should().Be("Encrypt data at rest");
        ruleName.Should().Be("Encrypt data at rest");
    }

    [Fact]
    public void BuildMetadataTypedPayload_returns_null_when_empty()
    {
        FindingInspectReadRepositoryCore.BuildMetadataTypedPayload(null, null).Should().BeNull();
    }
}
