using ArchLucid.Application.Clarifications;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Clarifications;

[Trait("Category", "Unit")]
public sealed class ReviewClarificationQuestionDeriverTests
{
    private readonly ReviewClarificationQuestionDeriver _deriver = CreateDeriver();

    [Fact]
    public void Derive_ExpandsMissingItems_FromCoverageFindings()
    {
        Finding topologyFinding = CreateFinding(
            FindingTypes.TopologyCoverageFinding,
            FindingSeverity.Warning,
            new TopologyCoverageFindingPayload
            {
                MissingCategories = ["Compute", "Data"],
            });

        ReviewClarificationDeriverResult result = _deriver.Derive([topologyFinding]);

        result.TotalDerivedCount.Should().Be(2);
        result.Questions.Should().HaveCount(2);
        result.Questions.Select(static question => question.MissingItem).Should().BeEquivalentTo(["Compute", "Data"]);
    }

    [Fact]
    public void Derive_CapsSurfacedQuestions_AtSeven_OrderedBySeverityDescending()
    {
        List<Finding> findings =
        [
            CreateFinding(
                FindingTypes.TopologyCoverageFinding,
                FindingSeverity.Info,
                new TopologyCoverageFindingPayload { MissingCategories = ["a", "b", "c"] }),
            CreateFinding(
                FindingTypes.SecurityCoverageFinding,
                FindingSeverity.Critical,
                new SecurityCoverageFindingPayload { UnprotectedResources = ["r1", "r2", "r3", "r4", "r5"] }),
        ];

        ReviewClarificationDeriverResult result = _deriver.Derive(findings);

        result.TotalDerivedCount.Should().Be(8);
        result.Questions.Should().HaveCount(7);
        result.Questions.Take(5).Should().OnlyContain(static question => question.Severity == FindingSeverity.Critical);
    }

    [Fact]
    public void Derive_DeduplicatesByQuestionId_KeepingHigherSeverity()
    {
        string missingItem = "shared-gap";
        Finding warningFinding = CreateFinding(
            FindingTypes.TopologyCoverageFinding,
            FindingSeverity.Warning,
            new TopologyCoverageFindingPayload { MissingCategories = [missingItem] });
        Finding criticalFinding = CreateFinding(
            FindingTypes.TopologyCoverageFinding,
            FindingSeverity.Critical,
            new TopologyCoverageFindingPayload { MissingCategories = [missingItem] });

        ReviewClarificationDeriverResult result = _deriver.Derive([warningFinding, criticalFinding]);

        result.TotalDerivedCount.Should().Be(1);
        result.Questions.Should().ContainSingle();
        result.Questions[0].Severity.Should().Be(FindingSeverity.Critical);
    }

    private static ReviewClarificationQuestionDeriver CreateDeriver()
    {
        IReviewClarificationRule[] rules =
        [
            new RequiredCapabilityCoverageClarificationRule(),
            new TopologyCoverageClarificationRule(),
            new PolicyCoverageClarificationRule(),
            new SecurityCoverageClarificationRule(),
            new SecurityBaselineCompletenessClarificationRule(),
            new PolicyApplicabilityClarificationRule(),
        ];

        return new ReviewClarificationQuestionDeriver(rules);
    }

    private static Finding CreateFinding(string findingType, FindingSeverity severity, object payload)
    {
        return new Finding
        {
            FindingId = Guid.NewGuid().ToString("N"),
            FindingType = findingType,
            Category = "Test",
            EngineType = "test",
            Severity = severity,
            Title = "Test finding",
            Rationale = "Test rationale",
            Payload = payload,
            PayloadType = payload.GetType().Name,
        };
    }
}
