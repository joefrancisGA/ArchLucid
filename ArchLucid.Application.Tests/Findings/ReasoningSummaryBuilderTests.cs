using System.Text.Json;

using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Suite", "Core")]
public sealed class ReasoningSummaryBuilderTests
{
    private readonly ReasoningSummaryBuilder _sut = new();

    [Fact]
    public void TryBuild_WhenCompleteMetadata_ReturnsThreeClauseSummary()
    {
        ArchitectureFinding finding = new()
        {
            Category = "data residency",
            Message = "Isolate PHI in a dedicated region. Expand monitoring.",
            Severity = FindingSeverity.Warning,
        };

        FindingInspectResponse inspect = new()
        {
            FindingId = "f1",
            Severity = FindingSeverity.Warning,
            DecisionRuleId = "rule-1",
            DecisionRuleName = "PII boundary enforcement",
            Evidence =
            [
                new FindingInspectEvidenceItem { Excerpt = "subgraph stores clear-text member ids" },
            ],
            RecommendedActions = ["Encrypt fields at rest before next release."],
            TypedPayload = JsonSerializer.SerializeToElement(finding),
            RunId = Guid.NewGuid(),
        };

        string? summary = _sut.TryBuild(inspect);

        summary.Should().NotBeNull();
        summary.Should().Contain("warning finding");
        summary.Should().Contain("PII boundary enforcement");
        summary.Should().Contain("subgraph stores clear-text member ids");
        summary.Should().Contain("Encrypt fields at rest before next release.");
        summary.Should().Contain("data residency");
    }

    [Fact]
    public void TryBuild_WhenEvidenceMissing_ReturnsNull()
    {
        FindingInspectResponse inspect = new()
        {
            FindingId = "f1",
            Severity = FindingSeverity.Info,
            DecisionRuleName = "Rule",
            Evidence = [],
            RecommendedActions = ["Act now."],
            TypedPayload = JsonSerializer.SerializeToElement(new ArchitectureFinding { Category = "c", Message = "m" }),
            RunId = Guid.NewGuid(),
        };

        _sut.TryBuild(inspect).Should().BeNull();
    }

    [Fact]
    public void TryBuild_WhenRecommendationMissing_ReturnsNull()
    {
        FindingInspectResponse inspect = new()
        {
            FindingId = "f1",
            Severity = FindingSeverity.Error,
            DecisionRuleName = "Rule",
            Evidence = [new FindingInspectEvidenceItem { Excerpt = "evidence" }],
            RecommendedActions = [],
            TypedPayload = JsonSerializer.SerializeToElement(new ArchitectureFinding { Category = "c", Message = "" }),
            RunId = Guid.NewGuid(),
        };

        _sut.TryBuild(inspect).Should().BeNull();
    }

    [Fact]
    public void TryBuild_WhenDecisionRuleMissing_ReturnsNull()
    {
        FindingInspectResponse inspect = new()
        {
            FindingId = "f1",
            Severity = FindingSeverity.Warning,
            DecisionRuleId = null,
            DecisionRuleName = null,
            Evidence = [new FindingInspectEvidenceItem { Excerpt = "evidence" }],
            RecommendedActions = ["Do something useful."],
            TypedPayload = JsonSerializer.SerializeToElement(
                new ArchitectureFinding { Category = "topology", Message = "Gap" }),
            RunId = Guid.NewGuid(),
        };

        _sut.TryBuild(inspect).Should().BeNull();
    }

    [Fact]
    public void TryBuild_WhenCategoryOmitted_UsesFallbackRiskPhrase()
    {
        ArchitectureFinding finding = new() { Category = "", Message = "Fix it.", Severity = FindingSeverity.Critical };

        FindingInspectResponse inspect = new()
        {
            FindingId = "f1",
            Severity = FindingSeverity.Critical,
            DecisionRuleName = "critical-path coverage",
            Evidence = [new FindingInspectEvidenceItem { Excerpt = "node-a" }],
            RecommendedActions = [],
            TypedPayload = JsonSerializer.SerializeToElement(finding),
            RunId = Guid.NewGuid(),
        };

        string? summary = _sut.TryBuild(inspect);

        summary.Should().NotBeNull();
        summary.Should().Contain("the assessed architecture risk");
    }

    [Fact]
    public void TryBuild_PrefersRecommendedAction_OverTypedMessage()
    {
        ArchitectureFinding finding = new()
        {
            Category = "cost",
            Message = "Typed message should not win.",
        };

        FindingInspectResponse inspect = new()
        {
            FindingId = "f1",
            Severity = FindingSeverity.Info,
            DecisionRuleName = "Spend guardrail",
            Evidence = [new FindingInspectEvidenceItem { Excerpt = "line item" }],
            RecommendedActions = ["Rightsize the pool. Continue monitoring monthly."],
            TypedPayload = JsonSerializer.SerializeToElement(finding),
            RunId = Guid.NewGuid(),
        };

        string? summary = _sut.TryBuild(inspect);

        summary.Should().Contain("Rightsize the pool.");
        summary.Should().NotContain("Typed message should not win.");
    }
}
