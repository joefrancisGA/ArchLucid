using ArchLucid.Application;
using ArchLucid.Application.Advisory;
using ArchLucid.Application.Agents;
using ArchLucid.Application.Alerts;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Authorization;
using ArchLucid.Application.Common;
using ArchLucid.Application.Billing;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Configuration;
using ArchLucid.Application.Connectors.Publishing;
using ArchLucid.Application.DataConsistency;
using ArchLucid.Application.CustomerSuccess;
using ArchLucid.Application.Determinism;
using ArchLucid.Application.Diagrams;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.PolicyPackDryRun.Stages;
using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.Governance.FindingReview;
using ArchLucid.Application.Integrations;
using ArchLucid.Application.Integrations.Confluence;
using ArchLucid.Application.Replay;
using ArchLucid.Application.Marketing;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.OperatorHome;
using ArchLucid.Application.Pilots;
using ArchLucid.Application.Planning;
using ArchLucid.Application.Reports;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Async;
using ArchLucid.Application.Runs.Async.Workers;
using ArchLucid.Application.Runs.Enrichment;
using ArchLucid.Application.Runs.ExecuteOwnership;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Application.Runs.Query.Stages;
using ArchLucid.Application.Runs.Sample;
using ArchLucid.Application.Runs.TechnologyLedger;
using ArchLucid.Application.Search;
using ArchLucid.Application.Summaries;
using ArchLucid.Application.Support;
using ArchLucid.Application.Traceability;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Connectors.Publishing;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Diagrams;
using ArchLucid.Core.Http;
using ArchLucid.Core.Persistence.ApplicationPorts.Agents;
using ArchLucid.Core.Hosting;
using ArchLucid.Core.Runs;
using ArchLucid.Host.Core.Demo;
using ArchLucid.Host.Core.Auth.Services;
using ArchLucid.Host.Core.Http;
using ArchLucid.Host.Core.Marketing;
using ArchLucid.Host.Core.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArchLucid.Host.Composition.Startup.Modules;

partial class RunLifecycleOrchestrationCompositionRegistrar
{
    private static void RegisterReplayAsync(IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IArchitectureRunArchiveService, ArchitectureRunArchiveService>();
        services.Configure<RunExecuteOwnershipLeaseOptions>(
            configuration.GetSection(RunExecuteOwnershipLeaseOptions.SectionName));
        services.TryAddSingleton<IWorkerHostDrainGate, WorkerHostDrainGate>();
        services.AddScoped<IRunExecuteOwnershipLeaseService, RunExecuteOwnershipLeaseService>();
        services.AddScoped<IRunExecuteOwnershipReconciliationService, RunExecuteOwnershipReconciliationService>();
        services.AddScoped<IStaleInFlightRunRemediator, StaleInFlightRunRemediator>();
        services.AddScoped<IMissingArchitectureRequestRunRemediator, MissingArchitectureRequestRunRemediator>();
        services.AddScoped<IRunEngineProvenanceCaptureService, RunEngineProvenanceCaptureService>();
        services.AddScoped<IExecuteTimeGovernanceScopeCaptureService, ExecuteTimeGovernanceScopeCaptureService>();
        services.AddScoped<ISampleRunPurgeService, SampleRunPurgeService>();
        services.AddScoped<IReplayRunCloneStage, ReplayRunCloneStage>();
        services.AddScoped<IReplayRunPrepareStage, ReplayRunPrepareStage>();
        services.AddScoped<IReplayRunCommitStage, ReplayRunCommitStage>();
        services.AddScoped<IReplayRunExecutePreparedStage, ReplayRunExecutePreparedStage>();
        services.AddScoped<IReplayRunService, ReplayRunService>();
        services.AddSingleton<ArchitectureRunAsyncOperationQueue>();
        services.AddSingleton<IArchitectureRunAsyncOperationQueue>(static sp =>
            sp.GetRequiredService<ArchitectureRunAsyncOperationQueue>());
        services.AddSingleton<IArchitectureRunAsyncOperationRegistrar, ArchitectureRunAsyncOperationRegistrar>();
        services.AddScoped<IFailedRunRetryAdmission, FailedRunRetryAdmission>();
        services.AddScoped<IArchitectureRunAsyncCreateAdmitter, ArchitectureRunAsyncCreateAdmitter>();
        services.AddScoped<IArchitectureRunAsyncOperationAcceptor, ArchitectureRunAsyncOperationAcceptor>();
        services.AddArchitectureRunAsyncOperationWorkers();
        services.AddHostedService<ArchitectureRunAsyncOperationHostedService>();
        services.AddScoped<IDeterminismCheckService, DeterminismCheckService>();
    }
}
