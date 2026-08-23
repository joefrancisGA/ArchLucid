using System.Reflection;

using ArchLucid.Persistence.Findings;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Findings;

/// <summary>
///     Unit coverage for <see cref="DapperFindingInspectReadRepository" /> mapping helpers.
/// </summary>
[Trait("Category", "Unit")]
public sealed class DapperFindingInspectReadRepositoryTests
{
    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_present_keeps_decision_rule_name_aligned_with_first_id()
    {
        (string? RuleId, string? RuleName) fields = InvokeResolveRuleFields(
            """["cost-guardrail"]""",
            firstRuleText: "Encrypt data at rest");

        fields.RuleId.Should().Be("cost-guardrail");
        fields.RuleName.Should().Be("cost-guardrail");
    }

    [Fact]
    public void ResolveRuleFields_when_applied_rule_ids_missing_uses_first_trace_rule_text_for_both_fields()
    {
        (string? RuleId, string? RuleName) fields = InvokeResolveRuleFields(
            appliedRuleIdsJson: null,
            firstRuleText: "Encrypt data at rest");

        fields.RuleId.Should().Be("Encrypt data at rest");
        fields.RuleName.Should().Be("Encrypt data at rest");
    }

    private static (string? RuleId, string? RuleName) InvokeResolveRuleFields(
        string? appliedRuleIdsJson,
        string? firstRuleText)
    {
        MethodInfo? method = typeof(DapperFindingInspectReadRepository).GetMethod(
            "ResolveRuleFields",
            BindingFlags.NonPublic | BindingFlags.Static);

        method.Should().NotBeNull("ResolveRuleFields should remain a private static helper on the repository");

        object? result = method!.Invoke(null, [appliedRuleIdsJson, firstRuleText]);

        result.Should().BeOfType<ValueTuple<string?, string?>>();

        (string? RuleId, string? RuleName) tuple = ((string?, string?))result!;

        return tuple;
    }
}
