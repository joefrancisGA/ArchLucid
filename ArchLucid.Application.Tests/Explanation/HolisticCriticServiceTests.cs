using ArchLucid.Application.Explanation;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Explanation;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class HolisticCriticServiceTests
{
    [Fact]
    public async Task GenerateAsync_returns_markdown_critique_with_disclaimer()
    {
        Guid runId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        ScopeContext scope = new();

        RunDetailDto detail = new()
        {
            Run = new RunRecord { RunId = runId, Description = "ClaimsPlatform" },
            GoldenManifest = new ManifestDocument(),
            FindingsSnapshot = new FindingsSnapshot
            {
                Findings =
                [
                    new Finding { FindingId = "f1", Severity = FindingSeverity.Error, Title = "Missing WAF on ingress." },
                ],
            },
        };

        RunExplanationSummary summary = new()
        {
            Explanation = new ExplanationResult { RawText = "Baseline summary" },
            ThemeSummaries = ["Encryption gaps", "Observability thin"],
            OverallAssessment = "Needs work before production",
            RiskPosture = "Elevated",
            FindingCount = 3,
            DecisionCount = 1,
            UnresolvedIssueCount = 2,
            ComplianceGapCount = 1,
        };

        Mock<IAuthorityQueryService> query = new();
        query.Setup(q => q.GetRunDetailAsync(scope, runId, It.IsAny<CancellationToken>())).ReturnsAsync(detail);

        Mock<IRunExplanationSummaryService> explanation = new();
        explanation.Setup(s => s.GetSummaryAsync(scope, runId, It.IsAny<CancellationToken>())).ReturnsAsync(summary);

        const string markdown = "## Blind spots\n- DR not discussed";

        Mock<IAgentCompletionClient> client = new();
        client
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync("""{"critiqueMarkdown":"## Blind spots\n- DR not discussed"}""");

        HolisticCriticService sut = new(query.Object, explanation.Object, client.Object);

        HolisticCriticResponse response = await sut.GenerateAsync(
            scope,
            runId,
            new HolisticCriticRequest { Focus = "Security" },
            CancellationToken.None);

        response.CritiqueMarkdown.Should().Be(markdown);
        response.Disclaimer.Should().Be(HolisticCriticResponse.DefaultDisclaimer);
    }

    [Fact]
    public async Task GenerateAsync_sample_findings_use_title_and_severity_honesty_copy()
    {
        Guid runId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        ScopeContext scope = new();

        RunDetailDto detail = new()
        {
            Run = new RunRecord { RunId = runId },
            GoldenManifest = new ManifestDocument(),
            FindingsSnapshot = new FindingsSnapshot
            {
                Findings =
                [
                    new Finding { FindingId = "f-id-only", Severity = FindingSeverity.Info },
                ],
            },
        };

        RunExplanationSummary summary = new()
        {
            Explanation = new ExplanationResult { RawText = "Baseline summary" },
            ThemeSummaries = [],
            OverallAssessment = "Needs work",
            RiskPosture = "Elevated",
        };

        Mock<IAuthorityQueryService> query = new();
        query.Setup(q => q.GetRunDetailAsync(scope, runId, It.IsAny<CancellationToken>())).ReturnsAsync(detail);

        Mock<IRunExplanationSummaryService> explanation = new();
        explanation.Setup(s => s.GetSummaryAsync(scope, runId, It.IsAny<CancellationToken>())).ReturnsAsync(summary);

        string? capturedPrompt = null;
        Mock<IAgentCompletionClient> client = new();
        client
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, It.IsAny<CancellationToken>()))
            .Callback<string, string, int?, float?, CancellationToken>((_, prompt, _, _, _) => capturedPrompt = prompt)
            .ReturnsAsync("""{"critiqueMarkdown":"## Blind spots\n- ok"}""");

        HolisticCriticService sut = new(query.Object, explanation.Object, client.Object);

        await sut.GenerateAsync(scope, runId, null, CancellationToken.None);

        capturedPrompt.Should().NotBeNull();
        capturedPrompt.Should().Contain("Finding title was not stored.");
        capturedPrompt.Should().Contain("[Severity was not stored.] Finding title was not stored.");
        capturedPrompt.Should().NotContain("f-id-only");
    }
}
