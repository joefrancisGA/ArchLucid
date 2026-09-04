using ArchLucid.Application.Pilots;
using ArchLucid.Application.Roi;
using ArchLucid.Core.Llm;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Roi;

[Trait("Suite", "Application")]
[Trait("Category", "Unit")]
public sealed class SponsorRoiBoardPackExporterNarrativeTests
{
    [Fact]
    public async Task ExportAsync_omits_executive_summary_when_narrative_disabled()
    {
        SponsorRoiBoardPackExporter sut = CreateSut(generateBoardPackNarrative: false, narrativeText: "Should not appear.");

        SponsorRoiBoardPackExportResult result = await sut.ExportAsync(
            SponsorRoiBoardPackFormat.Markdown,
            traceId: null,
            generateNarrative: true,
            CancellationToken.None);

        result.Markdown.Should().NotBeNullOrEmpty();
        result.Markdown.Should().NotContain("## Sponsor report");
    }

    [Fact]
    public async Task ExportAsync_prefixes_executive_summary_when_narrative_enabled()
    {
        SponsorRoiBoardPackExporter sut = CreateSut(
            generateBoardPackNarrative: true,
            narrativeText: "Savings remain concentrated in cost levers.");

        SponsorRoiBoardPackExportResult result = await sut.ExportAsync(
            SponsorRoiBoardPackFormat.Markdown,
            traceId: null,
            generateNarrative: true,
            CancellationToken.None);

        result.Markdown.Should().StartWith("## Sponsor report");
        result.Markdown.Should().Contain("Savings remain concentrated in cost levers.");
    }

    [Fact]
    public async Task ExportAsync_renders_structural_markdown_when_llm_fails()
    {
        SponsorRoiBoardPackExporter sut = CreateSut(
            generateBoardPackNarrative: true,
            narrativeThrows: true);

        SponsorRoiBoardPackExportResult result = await sut.ExportAsync(
            SponsorRoiBoardPackFormat.Markdown,
            traceId: null,
            generateNarrative: true,
            CancellationToken.None);

        result.Markdown.Should().NotBeNullOrEmpty();
        result.Markdown.Should().NotContain("## Sponsor report");
        result.Markdown.Should().Contain("# Sponsor ROI — Board Pack");
    }

    private static SponsorRoiBoardPackExporter CreateSut(
        bool generateBoardPackNarrative,
        string? narrativeText = null,
        bool narrativeThrows = false)
    {
        Mock<ISponsorRoiSummaryService> summaryService = new();
        summaryService
            .Setup(service => service.BuildAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new SponsorRoiSummaryResponse
            {
                TotalEstimatedUsdSavings = 120_000m,
                SystemCount = 2,
                LatestRunCount = 2,
                ResolvedFindingsCount30Days = 3,
                SavingsPricingBasis = SponsorRoiSavingsPricingBasis.Retail,
                TopSystemicIssues =
                [
                    new SystemicIssueSummary { Category = "Cost", Severity = "High", Count = 1 },
                ],
            });

        Mock<ITenantRepository> tenantRepository = new();
        tenantRepository
            .Setup(repo => repo.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Guid.NewGuid(), Name = "Contoso" });

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(CreateScope());

        Mock<IAgentCompletionClient> completionClient = new();

        if (narrativeThrows)
        {
            completionClient
                .Setup(client => client.CompleteJsonAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<int?>(),
                    It.IsAny<float?>(),
                    It.IsAny<CancellationToken>()))
                .ThrowsAsync(new InvalidOperationException("LLM unavailable"));
        }
        else
        {
            completionClient
                .Setup(client => client.CompleteJsonAsync(
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<int?>(),
                    It.IsAny<float?>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(narrativeText ?? string.Empty);
        }

        Mock<IOptionsMonitor<RoiBoardPackNarrativeOptions>> options = new();
        options.Setup(monitor => monitor.CurrentValue)
            .Returns(new RoiBoardPackNarrativeOptions { GenerateBoardPackNarrative = generateBoardPackNarrative });

        return new SponsorRoiBoardPackExporter(
            summaryService.Object,
            tenantRepository.Object,
            scopeProvider.Object,
            new SponsorRoiBoardPackPdfBuilder(),
            new SponsorRoiBoardPackNarrativeBuilder(completionClient.Object, NullLogger<SponsorRoiBoardPackNarrativeBuilder>.Instance),
            options.Object,
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>());
    }

    private static ScopeContext CreateScope() =>
        new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };
}
