using ArchLucid.Application.Common;
using ArchLucid.Application.Diagnostics;
using ArchLucid.Application.Evidence;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Persistence;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application;

public sealed partial class ArchitectureApplicationService
{
    public async Task<SeedFakeResultsResult> SeedFakeResultsAsync(string runId, PilotSeedFakeResultsOptions? pilotOptions = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(runId))
            return new SeedFakeResultsResult(false, 0, "RunId is required.", ApplicationServiceFailureKind.BadRequest);

        if (pilotOptions?.MarkRealModeFellBackToSimulator == true)
            await TryMarkPilotRealModeFellBackAsync(runId, cancellationToken);

        ArchitectureRunDetail? detail = await runDetailQueryService.GetRunDetailAsync(runId, cancellationToken);

        if (detail is null)
            return new SeedFakeResultsResult(false, 0, $"Run '{runId}' was not found.", ApplicationServiceFailureKind.RunNotFound);

        ArchitectureRun run = detail.Run;
        RunStateTransitionCheck seedSubmissionCheck = _runStateTransitionService.ValidateResultSubmissionAllowed(run.Status);

        if (!seedSubmissionCheck.IsAllowed)
            return new SeedFakeResultsResult(false, 0, seedSubmissionCheck.Message!, ApplicationServiceFailureKind.BadRequest);

        ArchitectureRequest? architectureRequest = await requestRepository.GetByIdAsync(run.RequestId, cancellationToken);

        if (architectureRequest is null)
            return new SeedFakeResultsResult(false, 0, $"ArchitectureRequest '{run.RequestId}' for run '{runId}' was not found.",
                ApplicationServiceFailureKind.ResourceNotFound);

        List<AgentTask> tasks = detail.Tasks;

        if (tasks.Count == 0)
            return new SeedFakeResultsResult(false, 0, "No tasks exist for this run.", ApplicationServiceFailureKind.BadRequest);

        List<AgentResult> existingResults = detail.Results;

        if (existingResults.Count > 0)
        {
            if (logger.IsEnabled(LogLevel.Information))
                logger.LogInformation("Fake results skipped (run already has results): RunId={RunId}, ExistingCount={Count}", LogSanitizer.Sanitize(runId),
                    existingResults.Count);

            // Prior seed may have written results before LegacyRunStatus promotion existed — heal status.
            await TryPromoteLegacyRunStatusAfterSeedAsync(runId, existingResults, cancellationToken);

            return new SeedFakeResultsResult(true, 0, null);
        }

        IReadOnlyList<AgentResult> fakeResults = FakeAgentResultFactory.CreateStarterResults(runId, tasks, architectureRequest);
        ArchitectureRunStatus newStatus = _runStateTransitionService.DeriveStatusAfterResultSubmission(fakeResults);
        await using IArchLucidUnitOfWork uow = await unitOfWorkFactory.CreateAsync(cancellationToken);

        try
        {
            await SeedFakeResultsPersistAsync(runId, fakeResults, architectureRequest, uow, cancellationToken);
            await uow.CommitAsync(cancellationToken);
        }
        catch
        {
            await uow.RollbackAsync(cancellationToken);
            throw;
        }

        try
        {
            await architectureFindingConfidenceEnricher.TryEnrichRunAsync(runId, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (logger.IsEnabled(LogLevel.Warning))
                logger.LogWarningWithSanitizedUserArg(ex, "Architecture finding confidence enrichment failed after fake seed for RunId={RunId}; continuing.",
                    runId);
        }

        await TryPromoteLegacyRunStatusAfterSeedAsync(runId, fakeResults, cancellationToken);

        if (logger.IsEnabled(LogLevel.Information))
            logger.LogInformation("Fake results seeded: RunId={RunId}, ResultCount={ResultCount}, NewStatus={NewStatus}", LogSanitizer.Sanitize(runId),
                fakeResults.Count, newStatus);

        return new SeedFakeResultsResult(true, fakeResults.Count, null);
    }

    /// <summary>
    ///     TB-937: commit requires ReadyForCommit. Seed skips execute, so promote Authority LegacyRunStatus from seeded results.
    /// </summary>
    private async Task TryPromoteLegacyRunStatusAfterSeedAsync(
        string runId,
        IReadOnlyList<AgentResult> results,
        CancellationToken cancellationToken)
    {
        if (!TryParseRunGuid(runId, out Guid runGuid))
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? header = await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (header is null)
            return;

        string previousLegacyRunStatus = header.LegacyRunStatus ?? string.Empty;

        if (string.Equals(previousLegacyRunStatus, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
            return;

        ArchitectureRunStatus derived = _runStateTransitionService.DeriveStatusAfterResultSubmission(results);

        if (derived is ArchitectureRunStatus.ReadyForCommit
            && !_runStateTransitionService.ShouldPromoteLegacyStatusToReadyForCommit(previousLegacyRunStatus))
            return;

        if (string.Equals(previousLegacyRunStatus, derived.ToString(), StringComparison.OrdinalIgnoreCase))
            return;

        header.LegacyRunStatus = derived.ToString();
        await _runRepository.UpdateAsync(header, cancellationToken);
    }

    private async Task SeedFakeResultsPersistAsync(string runId, IReadOnlyList<AgentResult> fakeResults, ArchitectureRequest request, IArchLucidUnitOfWork uow,
        CancellationToken cancellationToken)
    {
        // CommitRunAsync requires a persisted evidence package (normally written during ExecuteRun). Dev-only seed
        // skips execute, so create the package here when missing.
        AgentEvidencePackage? existingPackage = await agentEvidencePackageRepository.GetByRunIdAsync(runId, cancellationToken);

        if (existingPackage is null)
        {
            AgentEvidencePackage package = await evidenceBuilder.BuildAsync(runId, request, cancellationToken);

            if (uow.SupportsExternalTransaction)
                await agentEvidencePackageRepository.CreateAsync(package, cancellationToken, uow.Connection, uow.Transaction);
            else
                await agentEvidencePackageRepository.CreateAsync(package, cancellationToken);
        }

        if (uow.SupportsExternalTransaction)
            await resultRepository.CreateManyAsync(fakeResults, cancellationToken, uow.Connection, uow.Transaction);
        else
            await resultRepository.CreateManyAsync(fakeResults, cancellationToken);
    }

    private async Task TryMarkPilotRealModeFellBackAsync(string runId, CancellationToken cancellationToken)
    {
        if (!TryParseRunGuid(runId, out Guid runGuid))
            return;

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunRecord? header = await runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (header is null)
            return;
        header.RealModeFellBackToSimulator = true;
        header.StructuralExecutionMode = StructuralExecutionMode.Fallback;
        header.PilotAoaiDeploymentSnapshot = configuration["AzureOpenAI:DeploymentName"]?.Trim();
        await runRepository.UpdateAsync(header, cancellationToken);
        ArchLucidInstrumentation.RecordTryRealModePilotFellBackToSimulator();
        string actor = actorContext.GetActor();
        AuditEvent fellBack = scope.CreateAuditEvent(
            AuditEventTypes.FirstRealValueRunFellBackToSimulator,
            actor,
            actor);
        fellBack.RunId = runGuid;

        await auditService.LogAsync(fellBack, cancellationToken);
    }

    private static bool TryParseRunGuid(string runId, out Guid runGuid)
    {
        return Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
    }
}
