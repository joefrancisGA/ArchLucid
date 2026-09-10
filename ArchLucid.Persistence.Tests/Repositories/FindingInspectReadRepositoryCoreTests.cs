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
    public void ResolveRuleFields_when_applied_rule_ids_json_is_object_falls_back_to_trace_text()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            """{"ruleIds":["cost-guardrail"]}""",
            firstRuleText: "Encrypt data at rest");

        // DecisionTraceRepositoryCore serializes AppliedRuleIds as a JSON array only; object roots fail deserialize and fall back.
        ruleId.Should().Be("Encrypt data at rest");
        ruleName.Should().Be("Encrypt data at rest");
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_json_is_scalar_falls_back_to_trace_text()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            """"cost-guardrail"""",
            firstRuleText: "Encrypt data at rest");

        ruleId.Should().Be("Encrypt data at rest");
        ruleName.Should().Be("Encrypt data at rest");
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_json_is_empty_array_falls_back_to_trace_text()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            "[]",
            firstRuleText: "Encrypt data at rest");

        ruleId.Should().Be("Encrypt data at rest");
        ruleName.Should().Be("Encrypt data at rest");
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_json_is_empty_array_and_trace_missing_returns_nulls()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields("[]", firstRuleText: null);

        ruleId.Should().BeNull();
        ruleName.Should().BeNull();
    }

    [Fact]
    public void ResolveRuleFields_when_first_applied_rule_id_is_whitespace_uses_next_non_blank_id()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            """["   ", "cost-guardrail"]""",
            firstRuleText: null);

        ruleId.Should().Be("cost-guardrail");
        ruleName.Should().Be("cost-guardrail");
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_json_is_malformed_falls_back_to_trace_text()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            "[not-json",
            firstRuleText: "Encrypt data at rest");

        ruleId.Should().Be("Encrypt data at rest");
        ruleName.Should().Be("Encrypt data at rest");
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_json_is_blank_uses_trace_text()
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(
            "   ",
            firstRuleText: "Encrypt data at rest");

        ruleId.Should().Be("Encrypt data at rest");
        ruleName.Should().Be("Encrypt data at rest");
    }

    [Fact]
    public void BuildMetadataTypedPayload_returns_null_when_empty()
    {
        FindingInspectReadRepositoryCore.BuildMetadataTypedPayload(null, null).Should().BeNull();
    }

    [Fact]
    public void BuildMetadataTypedPayload_returns_slim_payload_when_only_title_is_present()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.BuildMetadataTypedPayload("Encrypt at rest", null);

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("title").GetString().Should().Be("Encrypt at rest");
        typed!.Value.GetProperty("rationale").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public void BuildMetadataTypedPayload_returns_slim_payload_when_only_rationale_is_present()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.BuildMetadataTypedPayload(null, "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("title").ValueKind.Should().Be(JsonValueKind.Null);
        typed!.Value.GetProperty("rationale").GetString().Should().Be("Missing TLS");
        typed!.Value.GetProperty("whyThisMatters").GetString().Should().Be("Missing TLS");
    }

    [Fact]
    public void BuildMetadataTypedPayload_trims_whitespace_from_title_and_rationale()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.BuildMetadataTypedPayload("  Encrypt at rest  ", "  Missing TLS  ");

        typed.Should().NotBeNull();
        typed!.Value.GetProperty("title").GetString().Should().Be("Encrypt at rest");
        typed!.Value.GetProperty("rationale").GetString().Should().Be("Missing TLS");
    }

    [Fact]
    public void ResolveTypedPayloadForInspect_returns_deserialized_object_when_payload_is_empty_json_object()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect(
            "{}",
            "Encrypt at rest",
            "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.ValueKind.Should().Be(JsonValueKind.Object);
        typed!.Value.EnumerateObject().Should().BeEmpty();
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

    [Fact]
    public void ResolveTypedPayloadForInspect_returns_json_null_element_when_payload_is_null_literal()
    {
        JsonElement? typed = FindingInspectReadRepositoryCore.ResolveTypedPayloadForInspect(
            "null",
            "Encrypt at rest",
            "Missing TLS");

        typed.Should().NotBeNull();
        typed!.Value.ValueKind.Should().Be(JsonValueKind.Null);
    }
}
