using ArchLucid.Application.Architecture;
using ArchLucid.Application.Governance.Coverage;
using ArchLucid.Application.Governance.Coverage.Stages;
using ArchLucid.Application.Governance.Posture;
using ArchLucid.Application.Runs;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules;

partial class RunLifecycleOrchestrationCompositionRegistrar
{
    private static void RegisterCoverage(IServiceCollection services)
    {
        services.AddScoped<ICoverageQueryService, CoverageQueryService>();
        services.AddScoped<IRunCoverageAcknowledgementService, RunCoverageAcknowledgementService>();
        services.AddScoped<ICoveragePreviewLoadStage, CoveragePreviewLoadStage>();
        services.AddScoped<ICoveragePreviewEmitStage, CoveragePreviewEmitStage>();
        services.AddScoped<ICoveragePreviewService, CoveragePreviewService>();
        services.AddSingleton<IExaminationStateResolver, ExaminationStateResolver>();
        services.AddScoped<IArchitecturePostureService, ArchitecturePostureService>();
        services.AddSingleton<CoverageAssignmentValidator>();
        services.AddScoped<IArchitectureRunCommandService, ArchitectureRunCommandService>();
        services.AddScoped<IExecuteEvidenceReadinessGate, ExecuteEvidenceReadinessGate>();
        services.AddScoped<IReRunExecuteSealedManifestPinGate, ReRunExecuteSealedManifestPinGate>();
    }
}
