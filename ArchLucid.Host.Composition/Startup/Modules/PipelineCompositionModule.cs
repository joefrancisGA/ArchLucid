// Application pipeline bounded-context composition registrations.

using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Common;
using ArchLucid.Application.Diagrams;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Evolution;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Integrations;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagrams;
using ArchLucid.Core.Http;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Http;
using ArchLucid.Host.Core.Services;
using ArchLucid.Persistence.Data.Repositories;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules;

/// <summary>
/// Run orchestration, export, replay, and context-ingestion pipeline DI registrations.
/// </summary>
public static class PipelineCompositionModule
{

    /// <summary>
    /// Registers application pipeline services: run export, replay, comparison, and context ingestion.
    /// </summary>
    public static void Register(IServiceCollection services, IConfiguration configuration)
    {
        RegisterRunExportAndArchitectureAnalysis(services, configuration);
        RegisterComparisonReplayAndDrift(services, configuration);
        AuthorityCommitPipelineCompositionRegistrar.Register(services, configuration);
        DraftIntakeCompositionRegistrar.Register(services, configuration);
        RunLifecycleOrchestrationCompositionRegistrar.Register(services, configuration);
        SponsorRoiCompositionRegistrar.Register(services, configuration);
        ContextIngestionCompositionRegistrar.Register(services, configuration);
    }

    private static void RegisterRunExportAndArchitectureAnalysis(IServiceCollection services, IConfiguration configuration)
    {
        ArchLucidOptions exportStorage = ArchLucidConfigurationBridge.ResolveArchLucidOptions(configuration);

        if (ArchLucidOptions.EffectiveIsInMemory(exportStorage.StorageProvider))

            services.AddSingleton<IRunExportRecordRepository, InMemoryRunExportRecordRepository>();

        else

            services.AddScoped<IRunExportRecordRepository, RunExportRecordRepository>();


        services.AddScoped<IRunExportAuditService, RunExportAuditService>();
        services.AddScoped<IArchitectureApplicationService, ArchitectureApplicationService>();
        services.AddScoped<IArchitectureAnalysisService, ArchitectureAnalysisService>();
        services.AddScoped<IShadowExecutionService, ShadowExecutionService>();
        services.AddScoped<ISimulationEvaluationService, SimulationEvaluationService>();
        services.AddScoped<IArchitectureAnalysisExportService, MarkdownArchitectureAnalysisExportService>();
        bool mermaidCliEnabled = configuration.GetValue("ArchLucid:MermaidCli:Enabled", false);

        if (mermaidCliEnabled)

            services.AddScoped<IDiagramImageRenderer, MermaidCliDiagramImageRenderer>();

        else

            services.AddScoped<IDiagramImageRenderer, NullDiagramImageRenderer>();

        services.AddScoped<IArchitectureAnalysisDocxExportService, DocxArchitectureAnalysisExportService>();
        services.Configure<ConsultingDocxTemplateOptions>(configuration.GetSection("ConsultingDocxTemplate"));
        services.AddScoped<IConsultingDocxTemplateOptionsProvider, DefaultConsultingDocxTemplateOptionsProvider>();
        services.AddScoped<IDocumentLogoProvider, FileSystemDocumentLogoProvider>();
        services.AddScoped<IArchitectureAnalysisConsultingDocxExportService, ConsultingDocxArchitectureAnalysisExportService>();
        services.AddSingleton<IConsultingDocxTemplateProfileResolver, DefaultConsultingDocxTemplateProfileResolver>();
        services.AddScoped<IConsultingDocxTemplateRecommendationService, ConsultingDocxTemplateRecommendationService>();
        services.AddScoped<IConsultingDocxExportProfileSelector, ConsultingDocxExportProfileSelector>();
        services.AddScoped<IEndToEndReplayComparisonService, EndToEndReplayComparisonService>();
        services.AddScoped<IEndToEndReplayComparisonSummaryFormatter, MarkdownEndToEndReplayComparisonSummaryFormatter>();
        services.AddScoped<IEndToEndReplayComparisonExportService, EndToEndReplayComparisonExportService>();
        services.AddHttpClient(RunExportBlobPushService.HttpClientName, static client =>
        {
            client.Timeout = TimeSpan.FromMinutes(5);
        })
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration);
        services.AddScoped<IRunExportBlobPushService, RunExportBlobPushService>();
        services.AddScoped<IRunExportAuthorityMaterialLoader, RunExportAuthorityMaterialLoader>();
        services.AddScoped<IRunExportPackageBuilder, RunExportPackageBuilder>();
        services.AddScoped<IRunExportLineageVerifier, RunExportLineageVerifier>();
        services.Configure<TerraformGitHubPrOptions>(
            configuration.GetSection(TerraformGitHubPrOptions.SectionPath));
        services.AddHttpClient(TerraformGitHubPrService.HttpClientName, static client =>
        {
            client.BaseAddress = new Uri("https://api.github.com/");
            client.Timeout = TimeSpan.FromSeconds(60);
        })
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration);
        services.AddScoped<ITerraformGitHubPrService, TerraformGitHubPrService>();
    }

    private static void RegisterComparisonReplayAndDrift(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<ReplayDiagnosticsOptions>(configuration.GetSection(ReplayDiagnosticsOptions.SectionName));

        ArchLucidOptions storageMode = ArchLucidConfigurationBridge.ResolveArchLucidOptions(configuration);

        if (ArchLucidOptions.EffectiveIsInMemory(storageMode.StorageProvider))

            services.AddSingleton<IComparisonRecordRepository, InMemoryComparisonRecordRepository>();

        else

            services.AddScoped<IComparisonRecordRepository, ComparisonRecordRepository>();


        services.AddScoped<IComparisonAuditService, ComparisonAuditService>();
        services.AddScoped<IComparisonDriftAnalyzer, ComparisonDriftAnalyzer>();
        services.AddScoped<IComparisonReplayService, ComparisonReplayService>();
        services.AddScoped<IComparisonReplayCostEstimator, ComparisonReplayCostEstimator>();
        services.AddScoped<IComparisonReplayApiService, ComparisonReplayApiService>();
        services.AddScoped<IComparisonDriftReportExportService, ComparisonDriftReportExportService>();
        services.AddSingleton<IReplayDiagnosticsRecorder, ReplayDiagnosticsRecorder>();
    }
}
