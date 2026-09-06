using ArchLucid.Application.Analysis;
using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Core.Explanation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class ArchitectureReviewExportServiceTests
{
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
            Metadata = new ManifestMetadata { ManifestVersion = "v9", CreatedUtc = DateTime.UtcNow }
        };

        ArchitectureRun run = new()
        {
            RunId = runId,
            RequestId = "req-x",
            Status = ArchitectureRunStatus.Committed,
            CurrentManifestVersion = "v9",
            CreatedUtc = DateTime.UtcNow,
            CompletedUtc = DateTime.UtcNow
        };

        return new ArchitectureRunDetail
        {
            Run = run,
            Manifest = manifest,
            HasBrokenManifestReference = false,
            AuthorityLifecyclePhase = AuthorityRunLifecyclePhase.Complete,
            DecisionTraces = []
        };
    }

    private static ArchitectureReviewExportService CreateSut(
        IRunDetailQueryService runDetailQuery,
        IArchitectureAnalysisService analysis,
        string? runIdForSealedExport = null,
        IScopeContextProvider? scopeContextProvider = null,
        ITenantRepository? tenantRepository = null,
        IRunExplanationSummaryService? runExplanationSummaryService = null)
    {
        IRunExplanationSummaryService explanation = runExplanationSummaryService ?? Mock.Of<IRunExplanationSummaryService>();
        ArchLucid.Decisioning.Services.ManifestHashService manifestHashService = new();

        IAuthorityQueryService authorityQuery = Mock.Of<IAuthorityQueryService>();

        if (!string.IsNullOrWhiteSpace(runIdForSealedExport)
            && SealedExportReceiptTestSupport.TryParseRunGuid(runIdForSealedExport, out Guid runGuid))
        {
            authorityQuery = SealedExportReceiptTestSupport.CreateAuthorityQueryService(runGuid, manifestHashService);
        }

        if (scopeContextProvider is not null)
            return new ArchitectureReviewExportService(
                runDetailQuery,
                authorityQuery,
                manifestHashService,
                Mock.Of<IGraphSnapshotRepository>(),
                analysis,
                scopeContextProvider,
                tenantRepository ?? Mock.Of<ITenantRepository>(),
                explanation,
                tenantReviewBoardCoverLogoStore: null,
                Mock.Of<Microsoft.Extensions.Configuration.IConfiguration>(),
                new ArchitectureReviewDocxBuilder(),
                new ArchitectureReviewPdfBuilder());
        Mock<IScopeContextProvider> scopeMock = new();
        scopeMock.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());
        scopeContextProvider = scopeMock.Object;

        return new ArchitectureReviewExportService(
            runDetailQuery,
            authorityQuery,
            manifestHashService,
            Mock.Of<IGraphSnapshotRepository>(),
            analysis,
            scopeContextProvider,
            tenantRepository ?? Mock.Of<ITenantRepository>(),
            explanation,
            tenantReviewBoardCoverLogoStore: null,
            Mock.Of<Microsoft.Extensions.Configuration.IConfiguration>(),
            new ArchitectureReviewDocxBuilder(),
            new ArchitectureReviewPdfBuilder());
    }

    [Fact]
    public async Task GenerateReportAsync_returns_pdf_when_finalized()
    {
        const string runId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

        ArchitectureRunDetail detail = CreateCommittedDetail(runId);

        Mock<IRunDetailQueryService> runDetailQuery = new();
        runDetailQuery.Setup(x => x.GetRunDetailAsync(runId, It.IsAny<CancellationToken>())).ReturnsAsync(detail);

        GoldenManifest manifest = detail.Manifest!;
        ArchitectureAnalysisReport report = new()
        {
            Run = detail.Run,
            Manifest = manifest,
            Summary = "Summary text."
        };

        Mock<IArchitectureAnalysisService> analysis = new();
        analysis.Setup(x => x.BuildAsync(It.IsAny<ArchitectureAnalysisRequest>(), It.IsAny<CancellationToken>())).ReturnsAsync(report);

        ArchitectureReviewExportService sut = CreateSut(runDetailQuery.Object, analysis.Object, runId);

        ExportResult result =
            await sut.GenerateReportAsync(runId, ExportFormat.Pdf, whitelabel: null, logoImageBytes: null, httpCorrelationId: "c1",
                CancellationToken.None);

        analysis.Verify(
            x => x.BuildAsync(It.Is<ArchitectureAnalysisRequest>(r => r.PreloadedRunDetail == detail && r.RunId == runId), It.IsAny<CancellationToken>()),
            Times.Once);

        result.ContentType.Should().Be("application/pdf");
        result.FileName.Should().StartWith("architecture-review-board-");

        using MemoryStream ms = new();
        await result.Content.CopyToAsync(ms);

        ms.Length.Should().BeGreaterThan(400);
        await result.Content.DisposeAsync();
    }

    [Fact]
    public async Task GenerateReportAsync_pdf_embeds_active_trial_notice_when_tenant_on_active_trial()
    {
        const string runId = "dddddddddddddddddddddddddddddddd";
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        ArchitectureRunDetail detail = CreateCommittedDetail(runId);

        Mock<IRunDetailQueryService> runDetailQuery = new();
        runDetailQuery.Setup(x => x.GetRunDetailAsync(runId, It.IsAny<CancellationToken>())).ReturnsAsync(detail);

        GoldenManifest manifest = detail.Manifest!;
        ArchitectureAnalysisReport report = new()
        {
            Run = detail.Run,
            Manifest = manifest,
            Summary = "Summary text."
        };

        Mock<IArchitectureAnalysisService> analysis = new();
        analysis.Setup(x => x.BuildAsync(It.IsAny<ArchitectureAnalysisRequest>(), It.IsAny<CancellationToken>())).ReturnsAsync(report);

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

        ArchitectureReviewExportService sut = CreateSut(runDetailQuery.Object, analysis.Object, runId, scope.Object, tenants.Object);

        ExportResult result =
            await sut.GenerateReportAsync(runId, ExportFormat.Pdf, whitelabel: null, logoImageBytes: null, httpCorrelationId: null,
                CancellationToken.None);

        Mock<ITenantRepository> convertedTenants = new();
        convertedTenants.Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantRecord
                {
                    Id = tenantId,
                    Name = "Paid tenant",
                    Slug = "paid",
                    Tier = TenantTier.Standard,
                    TrialStatus = TrialLifecycleStatus.Converted
                });

        ArchitectureReviewExportService sutConverted = CreateSut(runDetailQuery.Object, analysis.Object, runId, scope.Object, convertedTenants.Object);

        ExportResult convertedResult =
            await sutConverted.GenerateReportAsync(runId, ExportFormat.Pdf, whitelabel: null, logoImageBytes: null, httpCorrelationId: null,
                CancellationToken.None);

        using MemoryStream activeMs = new();
        await result.Content.CopyToAsync(activeMs);

        using MemoryStream convertedMs = new();
        await convertedResult.Content.CopyToAsync(convertedMs);

        activeMs.ToArray().Should().NotBeEquivalentTo(convertedMs.ToArray());

        await result.Content.DisposeAsync();
        await convertedResult.Content.DisposeAsync();
    }

    [Fact]
    public async Task GenerateReportAsync_html_includes_active_trial_notice_when_tenant_on_active_trial()
    {
        const string runId = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        ArchitectureRunDetail detail = CreateCommittedDetail(runId);

        Mock<IRunDetailQueryService> runDetailQuery = new();
        runDetailQuery.Setup(x => x.GetRunDetailAsync(runId, It.IsAny<CancellationToken>())).ReturnsAsync(detail);

        ArchitectureAnalysisReport report = new()
        {
            Run = detail.Run,
            Manifest = detail.Manifest,
            Summary = "Summary text."
        };

        Mock<IArchitectureAnalysisService> analysis = new();
        analysis.Setup(x => x.BuildAsync(It.IsAny<ArchitectureAnalysisRequest>(), It.IsAny<CancellationToken>())).ReturnsAsync(report);

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

        ArchitectureReviewExportService sut = CreateSut(runDetailQuery.Object, analysis.Object, runId, scope.Object, tenants.Object);

        ExportResult result =
            await sut.GenerateReportAsync(runId, ExportFormat.Html, whitelabel: null, logoImageBytes: null, httpCorrelationId: null,
                CancellationToken.None);

        using MemoryStream ms = new();
        await result.Content.CopyToAsync(ms);
        string html = System.Text.Encoding.UTF8.GetString(ms.ToArray());

        html.Should().Contain("Trial notice");
        html.Should().Contain(ActiveTrialExportNoticeFormatter.BaseSuffix);

        await result.Content.DisposeAsync();
    }

    [Fact]
    public async Task GenerateReportAsync_throws_when_run_missing()
    {
        Mock<IRunDetailQueryService> runDetailQuery = new();
        runDetailQuery.Setup(x => x.GetRunDetailAsync("missing", It.IsAny<CancellationToken>())).ReturnsAsync((ArchitectureRunDetail?)null);

        ArchitectureReviewExportService sut = CreateSut(runDetailQuery.Object, Mock.Of<IArchitectureAnalysisService>());

        Func<Task> act = async () =>
            await sut.GenerateReportAsync("missing", ExportFormat.Docx, null, null, null, CancellationToken.None);

        await act.Should().ThrowAsync<RunNotFoundException>();
    }

    [Fact]
    public async Task GenerateReportAsync_throws_conflict_when_not_finalized()
    {
        ArchitectureRunDetail detail = CreateCommittedDetail("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
        detail.Manifest = null;

        Mock<IRunDetailQueryService> runDetailQuery = new();
        runDetailQuery.Setup(x => x.GetRunDetailAsync(detail.Run.RunId, It.IsAny<CancellationToken>())).ReturnsAsync(detail);

        ArchitectureReviewExportService sut = CreateSut(runDetailQuery.Object, Mock.Of<IArchitectureAnalysisService>());

        Func<Task> act = async () =>
            await sut.GenerateReportAsync(detail.Run.RunId, ExportFormat.Docx, null, null, null, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*finalized review*");
    }

    [Fact]
    public async Task GenerateReportAsync_throws_conflict_when_broken_manifest_reference()
    {
        ArchitectureRunDetail detail = CreateCommittedDetail("cccccccccccccccccccccccccccccccc");
        detail.Manifest = null;
        detail.HasBrokenManifestReference = true;

        Mock<IRunDetailQueryService> runDetailQuery = new();
        runDetailQuery.Setup(x => x.GetRunDetailAsync(detail.Run.RunId, It.IsAny<CancellationToken>())).ReturnsAsync(detail);

        ArchitectureReviewExportService sut = CreateSut(runDetailQuery.Object, Mock.Of<IArchitectureAnalysisService>());

        Func<Task> act = async () =>
            await sut.GenerateReportAsync(detail.Run.RunId, ExportFormat.Docx, null, null, null, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*broken manifest reference*");
    }

    [Fact]
    public async Task GenerateReportAsync_throws_conflict_when_authority_lifecycle_not_complete()
    {
        const string runId = "ffffffffffffffffffffffffffffffff";
        ArchitectureRunDetail detail = CreateCommittedDetail(runId);
        detail.AuthorityLifecyclePhase = AuthorityRunLifecyclePhase.InProgress;

        Mock<IRunDetailQueryService> runDetailQuery = new();
        runDetailQuery.Setup(x => x.GetRunDetailAsync(runId, It.IsAny<CancellationToken>())).ReturnsAsync(detail);

        ArchitectureReviewExportService sut = CreateSut(runDetailQuery.Object, Mock.Of<IArchitectureAnalysisService>());

        Func<Task> act = async () =>
            await sut.GenerateReportAsync(runId, ExportFormat.Docx, null, null, null, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*authority lifecycle phase*");
    }

    [Fact]
    public async Task GenerateReportAsync_html_includes_demo_tenant_notice_for_demo_runs()
    {
        string runId = ContosoRetailDemoIdentifiers.RunBaseline;
        ArchitectureRunDetail detail = CreateCommittedDetail(runId);
        detail.Run.RequestId = ContosoRetailDemoIdentifiers.RequestContoso;

        Mock<IRunDetailQueryService> runDetailQuery = new();
        runDetailQuery.Setup(x => x.GetRunDetailAsync(runId, It.IsAny<CancellationToken>())).ReturnsAsync(detail);

        ArchitectureAnalysisReport report = new()
        {
            Run = detail.Run,
            Manifest = detail.Manifest,
            Summary = "Summary text."
        };

        Mock<IArchitectureAnalysisService> analysis = new();
        analysis.Setup(x => x.BuildAsync(It.IsAny<ArchitectureAnalysisRequest>(), It.IsAny<CancellationToken>())).ReturnsAsync(report);

        ArchitectureReviewExportService sut = CreateSut(runDetailQuery.Object, analysis.Object, runId);

        ExportResult result =
            await sut.GenerateReportAsync(runId, ExportFormat.Html, whitelabel: null, logoImageBytes: null, httpCorrelationId: null,
                CancellationToken.None);

        using MemoryStream ms = new();
        await result.Content.CopyToAsync(ms);
        string html = System.Text.Encoding.UTF8.GetString(ms.ToArray());

        html.Should().Contain("Demo notice");
        html.Should().Contain(ArchitectureReviewBoardCoverPageContent.DemoTenantNotice);

        await result.Content.DisposeAsync();
    }
}
