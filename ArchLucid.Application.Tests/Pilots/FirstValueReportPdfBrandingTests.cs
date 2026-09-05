using System.Security.Cryptography;
using System.Text;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Application.Pilots;
using ArchLucid.Application.Value;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Pilots;
using ArchLucid.Persistence.Value;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

using UglyToad.PdfPig;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
public sealed class FirstValueReportPdfBrandingTests
{
    [SkippableFact]
    public async Task BuildPdfAsync_with_active_profile_shows_company_name_and_archlucid_body_text()
    {
        ArchitectureRunDetail detail = BuildCommittedDetail();
        Mock<IRunDetailQueryService> query = new();
        query.Setup(q => q.GetRunDetailAsync("r-pdf-brand-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        Mock<IPilotRunDeltaComputer> deltas = new();
        deltas.Setup(d => d.ComputeAsync(detail, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateSendablePilotRunDeltas(detail));

        Mock<ITenantBrandingService> branding =
            FirstValueReportBrandingTestDoubles.CreateActiveTenantBrandService("Contoso Retail");

        FirstValueReportBuilder markdown = CreateMarkdownBuilder(
            query.Object,
            deltas.Object,
            branding.Object);
        FirstValueReportPdfBuilder sut = new(markdown);

        byte[]? pdf = await sut.BuildPdfAsync("r-pdf-brand-1", "http://localhost:5000");

        pdf.Should().NotBeNull();
        string pdfText = ExtractPdfText(pdf!);
        pdfText.Should().Contain("Contoso Retail");
        pdfText.Should().Contain("ArchLucid");
        pdfText.Should().Contain("Generated from run");
    }

    [SkippableFact]
    public async Task BuildPdfAsync_logo_checksum_isolated_between_tenants()
    {
        ArchitectureRunDetail detail = BuildCommittedDetail();
        Mock<IRunDetailQueryService> query = new();
        query.Setup(q => q.GetRunDetailAsync("r-pdf-brand-2", It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        Mock<IPilotRunDeltaComputer> deltas = new();
        deltas.Setup(d => d.ComputeAsync(detail, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateSendablePilotRunDeltas(detail));

        Mock<ITenantBrandingService> tenantABranding = FirstValueReportBrandingTestDoubles.CreateActiveTenantBrandService(
            "Tenant A Holdings",
            FirstValueReportBrandingTestDoubles.TenantALogo);

        Mock<ITenantBrandingService> tenantBBranding = FirstValueReportBrandingTestDoubles.CreateActiveTenantBrandService(
            "Tenant B Holdings",
            FirstValueReportBrandingTestDoubles.TenantBLogo);

        string tenantAChecksum = Convert.ToHexString(SHA256.HashData(FirstValueReportBrandingTestDoubles.TenantALogo));
        string tenantBChecksum = Convert.ToHexString(SHA256.HashData(FirstValueReportBrandingTestDoubles.TenantBLogo));

        FirstValueReportPdfBuilder tenantAPdf = new(
            CreateMarkdownBuilder(query.Object, deltas.Object, tenantABranding.Object));

        FirstValueReportPdfBuilder tenantBPdf = new(
            CreateMarkdownBuilder(query.Object, deltas.Object, tenantBBranding.Object));

        byte[]? tenantAPdfBytes = await tenantAPdf.BuildPdfAsync("r-pdf-brand-2", "http://localhost:5000");
        byte[]? tenantBPdfBytes = await tenantBPdf.BuildPdfAsync("r-pdf-brand-2", "http://localhost:5000");

        string tenantAText = ExtractPdfText(tenantAPdfBytes!);
        string tenantBText = ExtractPdfText(tenantBPdfBytes!);
        string tenantARaw = Encoding.Latin1.GetString(tenantAPdfBytes!);
        string tenantBRaw = Encoding.Latin1.GetString(tenantBPdfBytes!);

        string tenantAMarker = $"{TenantReportBrandingApplier.LogoChecksumMarkerPrefix}{tenantAChecksum}";
        string tenantBMarker = $"{TenantReportBrandingApplier.LogoChecksumMarkerPrefix}{tenantBChecksum}";

        (tenantAText.Contains(tenantAMarker) || tenantARaw.Contains(tenantAMarker)).Should().BeTrue();
        (tenantBText.Contains(tenantBMarker) || tenantBRaw.Contains(tenantBMarker)).Should().BeTrue();
        tenantAText.Should().NotContain(tenantBChecksum);
        tenantBText.Should().NotContain(tenantAChecksum);
        tenantARaw.Should().NotContain(tenantBChecksum);
        tenantBRaw.Should().NotContain(tenantAChecksum);
    }

    private static string ExtractPdfText(byte[] pdfBytes)
    {
        using MemoryStream stream = new(pdfBytes);
        using PdfDocument document = PdfDocument.Open(stream);

        return string.Join(
            "\n",
            document.GetPages().Select(page => page.Text?.Trim() ?? string.Empty).Where(text => text.Length > 0));
    }

    private static FirstValueReportBuilder CreateMarkdownBuilder(
        IRunDetailQueryService query,
        IPilotRunDeltaComputer deltas,
        ITenantBrandingService brandingService)
    {
        Mock<IValueReportMetricsReader> metrics = new();
        metrics
            .Setup(m => m.ReadAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ValueReportRawMetrics(
                    [],
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    8m,
                    "signup",
                    TimeProvider.System.GetUtcNow(),
                    6m,
                    3,
                    6m,
                    null,
                    null));

        Mock<IOptionsMonitor<ValueReportComputationOptions>> opt = new();
        opt.Setup(o => o.CurrentValue).Returns(new ValueReportComputationOptions());

        ValueReportBuilder valueReport = new(metrics.Object, opt.Object);

        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(
            new ScopeContext
            {
                TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            });

        IConfigurationRoot configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?> { ["AgentExecution:Mode"] = "Simulator", ["AzureOpenAI:DeploymentName"] = "gpt-test" })
            .Build();

        Mock<IOptionsMonitor<PublicSiteOptions>> siteOpts = new();
        siteOpts.Setup(s => s.CurrentValue).Returns(new PublicSiteOptions { BaseUrl = "https://ui.example" });

        ITenantReportBrandingApplyHelper reportBranding =
            FirstValueReportBrandingTestDoubles.CreateApplyHelper(brandingService);

        Mock<IPilotBaselineRepository> pilotBaselines = new();
        pilotBaselines
            .Setup(b => b.GetAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PilotBaselineRecord
                {
                    TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    BaselineHoursPerReview = 40m,
                    BaselineReviewsPerQuarter = 12,
                    BaselineArchitectHourlyCost = 175m,
                    UpdatedUtc = DateTimeOffset.UtcNow,
                });

        return new FirstValueReportBuilder(
            query,
            deltas,
            valueReport,
            scope.Object,
            new ExecutionProvenanceFooterRenderer(),
            configuration,
            siteOpts.Object,
            reportBranding,
            pilotBaselines.Object,
            FirstValueReportBuilderTestDoubles.CreateDefaultCostEvidenceResolver(),
            FirstValueReportBuilderTestDoubles.CreateDefaultFreshnessOptions(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            FirstValueReportBuilderTestDoubles.CreateGraphSnapshotRepository(),
            NullLogger<FirstValueReportBuilder>.Instance);
    }

    private static PilotRunDeltas CreateSendablePilotRunDeltas(ArchitectureRunDetail detail)
    {
        return new PilotRunDeltas
        {
            RunCreatedUtc = detail.Run.CreatedUtc,
            ManifestCommittedUtc = detail.Manifest!.Metadata.CreatedUtc,
            TimeToCommittedManifest = detail.Manifest.Metadata.CreatedUtc - detail.Run.CreatedUtc,
            FindingsBySeverity =
            [
                new KeyValuePair<string, int>("Warning", 2),
                new KeyValuePair<string, int>("Error", 1),
            ],
            AuditRowCount = 7,
            LlmCallCount = 4,
            TopFindingId = "top-finding-id",
            TopFindingSeverity = "Error",
            TopFindingEvidenceChain = new FindingEvidenceChainResponse
            {
                RunId = detail.Run.RunId,
                FindingId = "top-finding-id",
                ManifestVersion = detail.Manifest.Metadata.ManifestVersion,
                FindingsSnapshotId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            },
            IsDemoTenant = false,
        };
    }

    private static ArchitectureRunDetail BuildCommittedDetail()
    {
        ArchitectureRun run = new()
        {
            RunId = "r-pdf-brand-1",
            RequestId = "req",
            Status = ArchitectureRunStatus.Committed,
            CreatedUtc = new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc),
            CompletedUtc = new DateTime(2026, 4, 1, 1, 0, 0, DateTimeKind.Utc),
            CurrentManifestVersion = "v1",
        };

        GoldenManifest manifest = new()
        {
            RunId = "r-pdf-brand-1",
            SystemName = "DemoSystem",
            Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = run.CreatedUtc },
            Governance = new ManifestGovernance(),
        };

        return new ArchitectureRunDetail
        {
            Run = run,
            Manifest = manifest,
            Results = [],
            DecisionTraces = [],
            AuthorityLifecyclePhase = AuthorityRunLifecyclePhase.Complete,
        };
    }
}
