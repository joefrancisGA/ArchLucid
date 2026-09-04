using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class DecisionRuleCriteriaEvaluatorTests
{
    [Fact]
    public void TryEvaluate_when_criteria_value_mismatches_present_field_returns_false_without_missing_paths()
    {
        Finding finding = new()
        {
            FindingId = "finding-1",
            FindingType = "SecurityControlFinding",
            Category = "Security",
            EngineType = "security-baseline",
            Severity = FindingSeverity.Warning,
            Title = "MFA control gap",
            Rationale = "Control status is missing.",
            Payload = new SecurityControlFindingPayload
            {
                ControlId = "AC-3",
                ControlName = "MFA",
                Status = "missing",
                Impact = "High"
            },
            PayloadType = nameof(SecurityControlFindingPayload)
        };

        bool matched = DecisionRuleCriteriaEvaluator.TryEvaluate(
            finding,
            new Dictionary<string, string> { ["payload.controlId"] = "AC-2" },
            out IReadOnlyList<string> missingContextFieldPaths);

        matched.Should().BeFalse();
        missingContextFieldPaths.Should().BeEmpty();
    }
}
