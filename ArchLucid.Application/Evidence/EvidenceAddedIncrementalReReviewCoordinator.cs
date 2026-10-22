using System.Text.Json;

using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Evidence;

public interface IEvidenceAddedIncrementalReReviewCoordinator
{
    Task TryScheduleAfterBulkUploadAsync(Guid runId, int uploadedFileCount, CancellationToken cancellationToken = default);
}

/// <summary>
///     Triggers incremental re-review when evidence is attached after execute (robustness #4).
/// </summary>
public sealed class EvidenceAddedIncrementalReReviewCoordinator(
    IScopeContextProvider scopeContextProvider,
    IEvidenceAddedIncrementalReReviewQueue queue,
    IServiceScopeFactory serviceScopeFactory,
    IOptions<IncrementalReReviewOnEvidenceAddedOptions> options,
    ILogger<EvidenceAddedIncrementalReReviewCoordinator> logger) : IEvidenceAddedIncrementalReReviewCoordinator
{
    private const string StageName = "incremental-re-review-evidence-added";

    public async Task TryScheduleAfterBulkUploadAsync(
        Guid runId,
        int uploadedFileCount,
        CancellationToken cancellationToken = default)
    {
        if (uploadedFileCount <= 0 || !options.Value.Enabled)
            return;

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        await queue.EnqueueAsync(
                ct => ExecuteScheduledAsync(serviceScopeFactory, logger, scope, runId, uploadedFileCount, ct),
                cancellationToken)
            .ConfigureAwait(false);
    }

    private static async Task ExecuteScheduledAsync(
        IServiceScopeFactory serviceScopeFactory,
        ILogger<EvidenceAddedIncrementalReReviewCoordinator> logger,
        ScopeContext scope,
        Guid runId,
        int uploadedFileCount,
        CancellationToken cancellationToken)
    {
        await using AsyncServiceScope asyncScope = serviceScopeFactory.CreateAsyncScope();

        using IDisposable _ = AmbientScopeContext.Push(scope);

        IRunRepository runRepository = asyncScope.ServiceProvider.GetRequiredService<IRunRepository>();
        IArchitectureKnowledgeModelAccess? architectureKnowledgeModelAccess =
            asyncScope.ServiceProvider.GetService<IArchitectureKnowledgeModelAccess>();

        if (architectureKnowledgeModelAccess is null)
            return;

        RunRecord? run = await runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        if (run is null)
            return;

        string status = run.LegacyRunStatus ?? string.Empty;

        if (!string.Equals(status, nameof(ArchitectureRunStatus.ReadyForCommit), StringComparison.OrdinalIgnoreCase)
            && !string.Equals(status, nameof(ArchitectureRunStatus.WaitingForResults), StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        ArchitectureKnowledgeModel? model =
            await architectureKnowledgeModelAccess.GetForRunAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        if (model is null)
            return;

        IReRunExecuteSealedManifestPinGate reRunExecuteSealedManifestPinGate =
            asyncScope.ServiceProvider.GetRequiredService<IReRunExecuteSealedManifestPinGate>();

        await reRunExecuteSealedManifestPinGate.EnsureReadyAsync(runId.ToString("N"), cancellationToken)
            .ConfigureAwait(false);

        ReReviewScope reReviewScope = new()
        {
            AffectedElementIds = model.Elements.Select(static element => element.ElementId).ToList(),
            IncludeGlobalInvariantChecks = true,
            FullReReview = false,
            Trigger = ReReviewTrigger.EvidenceAdded,
        };

        IIncrementalReReviewService incrementalReReviewService =
            asyncScope.ServiceProvider.GetRequiredService<IIncrementalReReviewService>();
        IAsyncSpecialistReviewService specialistReviewService =
            asyncScope.ServiceProvider.GetRequiredService<IAsyncSpecialistReviewService>();
        IRunStageOutcomesRepository runStageOutcomesRepository =
            asyncScope.ServiceProvider.GetRequiredService<IRunStageOutcomesRepository>();
        IAuditService auditService = asyncScope.ServiceProvider.GetRequiredService<IAuditService>();
        DateTime startedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        await runStageOutcomesRepository
            .RecordStageStartedAsync(runId, StageName, startedUtc, cancellationToken)
            .ConfigureAwait(false);

        string outcomeStatus = "error";
        IncrementalReReviewResult result;

        try
        {
            result = await incrementalReReviewService
                .ReReviewAsync(model, reReviewScope, specialistReviewService, cancellationToken)
                .ConfigureAwait(false);

            bool allGlobalInvariantsPassed = result.GlobalInvariantResults.All(check => check.Passed);
            outcomeStatus = allGlobalInvariantsPassed ? "succeeded" : "completed-with-invariant-warnings";
        }
        finally
        {
            await runStageOutcomesRepository
                .RecordStageCompletedAsync(
                    runId,
                    StageName,
                    outcomeStatus,
                    TimeProvider.System.GetUtcNow().UtcDateTime,
                    cancellationToken)
                .ConfigureAwait(false);
        }

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.Run.IncrementalReReviewCompleted,
                ActorUserId = "system",
                ActorUserName = "system",
                ExplicitActor = true,
                OccurredUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = runId,
                DataJson = JsonSerializer.Serialize(new
                {
                    runId = runId.ToString("N"),
                    trigger = "evidence-added",
                    uploadedFileCount,
                    specialistResultCount = result.SpecialistResults.Count,
                }),
            },
            cancellationToken).ConfigureAwait(false);

        if (logger.IsEnabled(LogLevel.Information))
        {
            logger.LogInformation(
                "Incremental re-review after evidence upload completed for RunId={RunId} with {SpecialistResultCount} specialist results.",
                runId.ToString("N"),
                result.SpecialistResults.Count);
        }
    }
}
