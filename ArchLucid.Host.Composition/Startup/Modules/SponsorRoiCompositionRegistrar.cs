// Sponsor ROI and value-report composition registrations (extracted from PipelineCompositionModule).

using ArchLucid.Application.Architecture;
using ArchLucid.Application.Billing;
using ArchLucid.Application.CustomerSuccess;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Integrations.Confluence;
using ArchLucid.Application.Marketing;
using ArchLucid.Application.Pilots;
using ArchLucid.Application.Reports;
using ArchLucid.Application.Roi;
using ArchLucid.Application.Runs;
using ArchLucid.Application.SponsorReport;
using ArchLucid.Application.Traceability;
using ArchLucid.Application.Trust;
using ArchLucid.Application.Value;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Composition.ValueReports;
using ArchLucid.Host.Core.Marketing;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Coordination.Caching;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.Startup.Modules;

/// <summary>
///     Sponsor ROI summaries, value reports, pilot scorecards, and sponsor-facing export registrations.
/// </summary>
internal static class SponsorRoiCompositionRegistrar
{
    public static void Register(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<RunRoiEstimatorOptions>(configuration.GetSection(RunRoiEstimatorOptions.SectionPath));
        services.AddScoped<IRunRoiEstimator, RunRoiEstimator>();
        services.AddScoped<ITraceabilityBundleBuilder, TraceabilityBundleBuilder>();
        services.AddScoped<IFindingEvidenceChainService, FindingEvidenceChainService>();
        services.AddScoped<IRunRetrievalGroundingService, RunRetrievalGroundingService>();
        services.AddScoped<IRunTrustEvidenceCardBuilder, RunTrustEvidenceCardBuilder>();
        services.AddScoped<IFindingLlmAuditService, FindingLlmAuditService>();
        services.AddScoped<FirstValueReportBuilder>();
        services.AddScoped<IFirstValueReportBuilder>(static sp => sp.GetRequiredService<FirstValueReportBuilder>());
        services.AddScoped<SponsorReviewPacketBuilder>();
        services.AddScoped<ISponsorReviewPacketBuilder>(static sp => sp.GetRequiredService<SponsorReviewPacketBuilder>());
        services.AddScoped<ISponsorReportService, SponsorReportService>();
        services.AddScoped<ITenantEstimatedUsdSavingsResolver, TenantEstimatedUsdSavingsResolver>();
        services.AddScoped<SponsorRoiTenantPricingContextResolver>();
        services.AddScoped<RoiCostEvidenceCollectionResolver>();
        services.AddScoped<RoiCostEvidenceFreshnessEvaluator>();
        services.AddScoped<SponsorRoiPricingLabelResolver>();
        services.AddScoped<SponsorRoiRunCollector>();
        services.AddScoped<SponsorRoiSummaryBuilder>();
        services.AddScoped<SponsorRoiHistoryBuilder>();
        services.AddScoped<SponsorRoiExportBuilder>();
        services.AddScoped<CrossTenantPortfolioSummaryBuilder>();
        services.AddScoped<SponsorRoiSummaryService>();
        services.AddScoped<ISponsorRoiSummaryService>(static sp =>
            new CachingSponsorRoiSummaryService(
                sp.GetRequiredService<SponsorRoiSummaryService>(),
                sp.GetRequiredService<IRiskExceptionService>(),
                sp.GetRequiredService<IArchitectureRiskRegisterService>(),
                sp.GetRequiredService<IHotPathReadCache>(),
                sp.GetRequiredService<IScopeContextProvider>(),
                sp.GetRequiredService<IOptionsMonitor<SponsorRoiCacheWarmupOptions>>()));
        services.AddScoped<SponsorRoiBoardPackPdfBuilder>();
        services.AddScoped<SponsorRoiBoardPackNarrativeBuilder>();
        services.AddScoped<ISponsorRoiBoardPackExporter, SponsorRoiBoardPackExporter>();
        services.Configure<RoiBoardPackNarrativeOptions>(
            configuration.GetSection(RoiBoardPackNarrativeOptions.SectionPath));
        services.Configure<SponsorRoiCacheWarmupOptions>(
            configuration.GetSection(SponsorRoiCacheWarmupOptions.SectionPath));
        services.Configure<SponsorRoiSavingsGaugeOptions>(
            configuration.GetSection(SponsorRoiSavingsGaugeOptions.SectionPath));
        services.Configure<RoiCostEvidenceFreshnessOptions>(
            configuration.GetSection(RoiCostEvidenceFreshnessOptions.SectionPath));
        services.AddScoped<ISponsorReportsSummaryService, SponsorReportsSummaryService>();
        services.AddScoped<IConfluenceFirstValueReportPublisher, ConfluenceFirstValueReportPublisher>();
        services.AddScoped<FirstValueReportPdfBuilder>();
        services.AddScoped<WhyArchLucidPackPdfBuilder>();
        services.AddScoped<SponsorBriefPdfBuilder>();
        services.AddScoped<PilotScorecardBuilder>();
        services.AddScoped<IPilotInProductScorecardService, PilotInProductScorecardService>();
        services.AddScoped<SponsorOnePagerPdfBuilder>();
        services.AddScoped<BoardPackPdfBuilder>();
        services.AddScoped<IWhyArchLucidSnapshotService, WhyArchLucidSnapshotService>();
        services.AddScoped<IRealizedValueAttestationService, RealizedValueAttestationService>();
        services.AddScoped<IBuyerProofPackBuilder, BuyerProofPackBuilder>();
        services.AddScoped<ITenantLlmCostTopRunRanker, TenantLlmCostTopRunRanker>();
        services.AddScoped<ITenantLlmCostReportingService, TenantLlmCostReportingService>();
        services.AddScoped<IAdminFleetLlmCogsService, AdminFleetLlmCogsService>();
        services.AddScoped<ISponsorEvidencePackService, SponsorEvidencePackService>();
        services.AddScoped<IPilotValueReportService, PilotValueReportService>();
        services.AddScoped<IPilotValueReportMarkdownFormatter, PilotValueReportMarkdownFormatter>();
        services.AddScoped<ValueReportSnapshotMarkdownFormatter>();
        services.AddScoped<ITenantMeasuredRoiService, TenantMeasuredRoiService>();
        services.Configure<ValueReportComputationOptions>(
            configuration.GetSection(ValueReportComputationOptions.SectionPath));
        services.AddScoped<ValueReportBuilder>();

        ValueReportJobPollStateCacheRegistrar.Register(services, configuration);

        services.AddSingleton<IValueReportJobQueue, InMemoryValueReportJobQueue>();
    }
}
