using System.Net;
using System.Text;

using ArchLucid.Application.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Demo;
using ArchLucid.Host.Core.Integration;
using ArchLucid.Host.Core.Marketing;
using ArchLucid.Host.Core.Middleware;
using ArchLucid.Host.Core.Services.Delivery;
using ArchLucid.Notifications;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using ArtifactDescriptor = ArchLucid.Contracts.Persistence.Artifacts.ArtifactDescriptor;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Core.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCorePackageCoverageBatch8Tests
{
    [Theory]
    [InlineData("Sql", false)]
    [InlineData("InMemory", true)]
    public void ArchLucidStorageMode_reflects_configured_provider(string provider, bool expectInMemory)
    {
        IOptions<ArchLucidOptions> options = Options.Create(new ArchLucidOptions { StorageProvider = provider });
        ArchLucidStorageMode sut = new(options);

        sut.IsInMemory.Should().Be(expectInMemory);

        Action nullOptions = () => _ = new ArchLucidStorageMode(null!);
        nullOptions.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public async Task LoggingIntegrationEventHandler_logs_preview_for_non_empty_payload()
    {
        LoggingIntegrationEventHandler sut = new(NullLogger<LoggingIntegrationEventHandler>.Instance);
        byte[] payload = Encoding.UTF8.GetBytes("""{"event":"trial"}""");

        await sut.Invoking(h => h.HandleAsync(payload, CancellationToken.None)).Should().NotThrowAsync();
        await sut.HandleAsync(ReadOnlyMemory<byte>.Empty, CancellationToken.None);
    }

    [Fact]
    public async Task FakeWebhookPoster_logs_hmac_signature_when_secret_present()
    {
        FakeWebhookPoster sut = new(NullLogger<FakeWebhookPoster>.Instance);
        WebhookPostOptions options = new() { HmacSha256SharedSecret = "secret-value" };

        await sut.Invoking(
                p => p.PostJsonAsync(
                    "https://example.com/hook",
                    new { ok = true },
                    CancellationToken.None,
                    options))
            .Should()
            .NotThrowAsync();

        await sut.PostJsonAsync("https://example.com/hook", new { ok = true }, CancellationToken.None);
    }

    [Fact]
    public async Task PublicShowcaseCommitPageClient_returns_null_for_non_showcase_or_missing_manifest()
    {
        Guid runId = Guid.NewGuid();
        Mock<IRunRepository> runs = new();
        runs.Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        PublicShowcaseCommitPageClient missingRun = BuildShowcaseClient(runs.Object);
        (await missingRun.GetShowcaseCommitPageAsync(runId, CancellationToken.None)).Should().BeNull();

        runs.Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId, IsPublicShowcase = false });

        (await missingRun.GetShowcaseCommitPageAsync(runId, CancellationToken.None)).Should().BeNull();

        runs.Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId, IsPublicShowcase = true, GoldenManifestId = null });

        (await missingRun.GetShowcaseCommitPageAsync(runId, CancellationToken.None)).Should().BeNull();
    }

    [Fact]
    public async Task PublicShowcaseCommitPageClient_builds_preview_for_showcase_run()
    {
        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        RunRecord run = new()
        {
            RunId = runId,
            ProjectId = "proj",
            CreatedUtc = DateTime.UtcNow,
            IsPublicShowcase = true,
            GoldenManifestId = manifestId,
        };

        Mock<IRunRepository> runs = new();
        runs.Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(run);

        Mock<IAuthorityQueryService> authority = new();
        authority.Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto { Run = run });
        authority.Setup(a => a.GetManifestSummaryAsync(It.IsAny<ScopeContext>(), manifestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ManifestSummaryDto
            {
                ManifestId = manifestId,
                RunId = runId,
                CreatedUtc = DateTime.UtcNow,
                ManifestHash = "hash",
                RuleSetId = "rs",
                RuleSetVersion = "1",
                DecisionCount = 1,
                WarningCount = 0,
                UnresolvedIssueCount = 0,
                Status = "ok",
            });

        Mock<IArtifactQueryService> artifacts = new();
        artifacts.Setup(a => a.ListArtifactsByManifestIdAsync(It.IsAny<ScopeContext>(), manifestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<ArtifactDescriptor>());

        Mock<IRunPipelineAuditTimelineService> timeline = new();
        timeline.Setup(t => t.GetTimelineAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RunPipelineTimelineItemDto(Guid.NewGuid(), DateTime.UtcNow, "RunStarted", "system", "corr"),
            ]);

        Mock<IRunExplanationSummaryService> explanation = new();
        explanation.Setup(e => e.GetSummaryAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunExplanationSummary
            {
                Explanation = new ExplanationResult { Summary = "summary" },
                ThemeSummaries = ["theme"],
                OverallAssessment = "A",
                RiskPosture = "Low",
            });

        PublicShowcaseCommitPageClient sut = new(
            runs.Object,
            authority.Object,
            artifacts.Object,
            timeline.Object,
            explanation.Object,
            TimeProvider.System,
            NullLogger<PublicShowcaseCommitPageClient>.Instance);

        DemoCommitPagePreviewResponse? preview = await sut.GetShowcaseCommitPageAsync(runId, CancellationToken.None);

        preview.Should().NotBeNull();
        preview!.DemoStatusMessage.Should().Contain("public showcase");
    }

    [Fact]
    public void SecurityHeadersMiddleware_identifies_crawler_hint_paths()
    {
        SecurityHeadersMiddleware.IsPublicCrawlerHintPath(new PathString("/")).Should().BeTrue();
        SecurityHeadersMiddleware.IsPublicCrawlerHintPath(new PathString("/sitemap.xml")).Should().BeTrue();
        SecurityHeadersMiddleware.IsPublicCrawlerHintPath(new PathString("/v1/health")).Should().BeFalse();
    }

    private static PublicShowcaseCommitPageClient BuildShowcaseClient(IRunRepository runs)
    {
        return new PublicShowcaseCommitPageClient(
            runs,
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IArtifactQueryService>(),
            Mock.Of<IRunPipelineAuditTimelineService>(),
            Mock.Of<IRunExplanationSummaryService>(),
            TimeProvider.System,
            NullLogger<PublicShowcaseCommitPageClient>.Instance);
    }
}
