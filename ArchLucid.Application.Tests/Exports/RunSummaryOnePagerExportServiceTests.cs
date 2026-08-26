using ArchLucid.Application;
using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RunSummaryOnePagerExportServiceTests
{
    [Fact]
    public async Task GenerateMarkdownAsync_includes_demo_and_active_trial_notices()
    {
        string runId = ContosoRetailDemoIdentifiers.RunBaseline;
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        ArchitectureRunDetail detail = CreateCommittedDetail(runId);
        detail.Run.RequestId = ContosoRetailDemoIdentifiers.RequestContoso;

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails.Setup(x => x.GetRunDetailAsync(runId, It.IsAny<CancellationToken>())).ReturnsAsync(detail);

        Mock<IAgentCompletionClient> completion = new();
        completion
            .Setup(x => x.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync("Sponsor posture summary.");

        Mock<IOptionsMonitor<GenerateRunSummaryOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new GenerateRunSummaryOptions { Enabled = true });

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = tenantId });

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantRecord
                {
                    Id = tenantId,
                    Name = "Trial tenant",
                    Slug = "trial",
                    Tier = TenantTier.Standard,
                    TrialStatus = TrialLifecycleStatus.Active
                });

        RunSummaryOnePagerExportService sut = new(
            runDetails.Object,
            completion.Object,
            options.Object,
            scope.Object,
            tenants.Object);

        RunSummaryOnePagerExportResult result = await sut.GenerateMarkdownAsync(runId, CancellationToken.None);
        string markdown = System.Text.Encoding.UTF8.GetString(result.Content);

        markdown.Should().Contain("Demo notice");
        markdown.Should().Contain(ArchitectureReviewBoardCoverPageContent.DemoTenantNotice);
        markdown.Should().Contain("Trial notice");
        markdown.Should().Contain(ActiveTrialExportNoticeFormatter.BaseSuffix);
    }

    [Fact]
    public async Task GenerateMarkdownAsync_throws_conflict_when_broken_manifest_reference()
    {
        const string runId = "cccccccccccccccccccccccccccccccc";

        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun
            {
                RunId = runId,
                Status = ArchitectureRunStatus.Committed,
                CurrentManifestVersion = "v-missing"
            },
            Manifest = null,
            HasBrokenManifestReference = true
        };

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails.Setup(x => x.GetRunDetailAsync(runId, It.IsAny<CancellationToken>())).ReturnsAsync(detail);

        Mock<IOptionsMonitor<GenerateRunSummaryOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new GenerateRunSummaryOptions { Enabled = true });

        RunSummaryOnePagerExportService sut = new(
            runDetails.Object,
            Mock.Of<IAgentCompletionClient>(),
            options.Object,
            Mock.Of<IScopeContextProvider>(),
            Mock.Of<ITenantRepository>());

        Func<Task> act = () => sut.GenerateMarkdownAsync(runId, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*broken manifest reference*");
    }

    private static ArchitectureRunDetail CreateCommittedDetail(string runId)
    {
        GoldenManifest manifest = new()
        {
            RunId = runId,
            SystemName = "Contoso",
            Services = [],
            Datastores = [],
            Relationships = [],
            Governance = new ManifestGovernance(),
            Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = DateTime.UtcNow }
        };

        return new ArchitectureRunDetail
        {
            Run = new ArchitectureRun
            {
                RunId = runId,
                Status = ArchitectureRunStatus.Committed,
                CurrentManifestVersion = "v1"
            },
            Manifest = manifest,
            HasBrokenManifestReference = false
        };
    }
}
