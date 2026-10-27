using ArchLucid.Application.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class BuyerProofPackArtifactSummaryBuilderTests
{
    [Fact]
    public void Build_WhenGovernedFindingCoveragePresent_EmitsGovernedCoverageSection()
    {
        const string deltasJson = """
                                  {
                                    "findingsBySeverity": [
                                      { "severity": "Error", "count": 2 }
                                    ],
                                    "governedFindingCoverage": {
                                      "isAvailable": true,
                                      "totalDecisionGradeCount": 2,
                                      "governedCount": 1,
                                      "advisoryCount": 1,
                                      "withPolicyRuleCount": 1,
                                      "withEvidenceRefsCount": 1,
                                      "governedPercentage": 50.0
                                    }
                                  }
                                  """;

        string markdown = BuyerProofPackArtifactSummaryBuilder.Build(deltasJson);

        markdown.Should().Contain("## Governed finding coverage");
        markdown.Should().Contain("| Total decision-grade findings | 2 |");
        markdown.Should().Contain("| Governance-blocking | 1 |");
        markdown.Should().Contain("| Governed share | 50.0% |");
    }

    [Fact]
    public void Build_WhenProofPackageLlmCallCountNull_renders_null_not_zero()
    {
        const string deltasJson = """
                                  {
                                    "proofPackageCompleteness": {
                                      "llmCallCount": null,
                                      "llmCallCountResolved": false
                                    }
                                  }
                                  """;

        string markdown = BuyerProofPackArtifactSummaryBuilder.Build(deltasJson);

        markdown.Should().Contain("`llmCallCount` | Value was not stored.");
        markdown.Should().NotContain("`llmCallCount` | 0");
    }

    [Fact]
    public void Build_when_severity_or_count_missing_uses_not_stored_labels()
    {
        const string deltasJson = """
                                  {
                                    "findingsBySeverity": [
                                      { "severity": "", "count": 0 },
                                      { "severity": "Warning" }
                                    ]
                                  }
                                  """;

        string markdown = BuyerProofPackArtifactSummaryBuilder.Build(deltasJson);

        markdown.Should().Contain("Severity was not stored.");
        markdown.Should().Contain("Count was not stored.");
    }

    [Fact]
    public void Build_when_audit_row_count_truncated_does_not_echo_cap_in_compact_summary()
    {
        const string deltasJson = """
                                  {
                                    "auditRowCount": 500,
                                    "auditRowCountTruncated": true,
                                    "findingsBySeverity": [
                                      { "severity": "Warning", "count": 1 }
                                    ]
                                  }
                                  """;

        string markdown = BuyerProofPackArtifactSummaryBuilder.Build(deltasJson);

        markdown.Should().NotContain("query cap");
        markdown.Should().NotContain("auditRowCountTruncated");
    }
}
