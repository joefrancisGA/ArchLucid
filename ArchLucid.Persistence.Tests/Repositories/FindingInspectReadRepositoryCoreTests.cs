using System.Text.Json;

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
    public void ResolveRuleFields_when_first_applied_rule_id_is_null_uses_next_non_blank_id()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            """[null, "cost-guardrail"]""",
            firstRuleText: null);

        ruleId.Should().Be("cost-guardrail");
        ruleName.Should().Be("cost-guardrail");
    }

    [Fact]
    public void BuildMetadataTypedPayload_returns_null_when_empty()
    {
        FindingInspectReadRepositoryCore.BuildMetadataTypedPayload(null, null).Should().BeNull();
    }

    [Fact]
    public void ResolveTypedPayloadForInspect_returns_null_when_payload_json_missing()
    {
        FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect(null, "title", "rationale").Should().BeNull();
        FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect("  ", "title", "rationale").Should().BeNull();
    }

    [Fact]
    public void ResolveTypedPayloadForInspect_returns_deserialized_json_when_valid()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect(
            """{"resourceId":"vm-1"}""",
            "title",
            "rationale");

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("resourceId").GetString().Should().Be("vm-1");
    }

    [Fact]
    public void ResolveTypedPayloadForInspect_falls_back_to_metadata_when_payload_json_is_corrupt()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect(
            "{ not json",
            "Encrypt at rest",
            "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("title").GetString().Should().Be("Encrypt at rest");
        typed!.Value.GetProperty("rationale").GetString().Should().Be("Missing TLS");
    }

    [Fact]
    public void TryParsePayloadJson_returns_null_for_corrupt_json_without_metadata_fallback()
    {
        FindingInspectReadRepositoryCore.TryParsePayloadJson("{ not json").Should().BeNull();
    }
}
