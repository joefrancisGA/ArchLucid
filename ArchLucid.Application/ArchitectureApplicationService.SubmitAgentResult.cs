// stryker disable all
using ArchLucid.Application.Common;
using ArchLucid.Application.Diagnostics;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Persistence;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Connections;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application;

public sealed partial class ArchitectureApplicationService
{
    public async Task<SubmitResultResult> SubmitAgentResultAsync(string runId, AgentResult? result, CancellationToken cancellationToken = default)
    {
        if (result is null)
            return new SubmitResultResult(false, null, "Agent result is required.", ApplicationServiceFailureKind.BadRequest);

        if (string.IsNullOrWhiteSpace(runId))
            return new SubmitResultResult(false, null, "RunId is required.", ApplicationServiceFailureKind.BadRequest);

        ArchitectureRunDetail? detail = await runDetailQueryService.GetRunDetailAsync(runId, cancellationToken);

        if (detail is null)
            return new SubmitResultResult(false, null, $"Run '{runId}' was not found.", ApplicationServiceFailureKind.RunNotFound);

        ArchitectureRun run = detail.Run;
        List<AgentTask> tasks = detail.Tasks;
        List<AgentResult> existingResults = detail.Results;

        if (detail.AuthorityPipelineComplete)
        {
            return new SubmitResultResult(
                false,
                null,
                $"Run '{runId}' is authority-pipeline complete and does not accept agent results.",
                ApplicationServiceFailureKind.Conflict);
        }

        RunStateTransitionCheck submissionCheck = _runStateTransitionService.ValidateResultSubmissionAllowed(run.Status);

        if (!submissionCheck.IsAllowed)
            return new SubmitResultResult(false, null, submissionCheck.Message!, ApplicationServiceFailureKind.BadRequest);

        if (!string.Equals(result.RunId, runId, StringComparison.OrdinalIgnoreCase))
            return new SubmitResultResult(false, null, $"Result RunId '{result.RunId}' does not match route runId '{runId}'.",
                ApplicationServiceFailureKind.BadRequest);

        AgentTask? task = tasks.FirstOrDefault(t => string.Equals(t.TaskId, result.TaskId, StringComparison.Ordinal));

        if (task is null)
            return new SubmitResultResult(false, null, $"Task '{result.TaskId}' was not found for run '{runId}'.",
                ApplicationServiceFailureKind.ResourceNotFound);

        if (task.AgentType != result.AgentType)
            return new SubmitResultResult(false, null,
                $"Result AgentType '{result.AgentType}' does not match task AgentType '{task.AgentType}' for task '{result.TaskId}'.",
                ApplicationServiceFailureKind.BadRequest);

        if (existingResults.Any(r => string.Equals(r.TaskId, result.TaskId, StringComparison.Ordinal)))
            return new SubmitResultResult(false, null, $"A result for task '{result.TaskId}' has already been submitted for this run.",
                ApplicationServiceFailureKind.BadRequest);

        await using IArchLucidUnitOfWork uow = await unitOfWorkFactory.CreateAsync(cancellationToken);
        try
        {
            ArchitectureRunStatus newStatus = await SubmitAgentResultPersistAsync(runId, result, uow, cancellationToken);
            await uow.CommitAsync(cancellationToken);
            try
            {
                await architectureFindingConfidenceEnricher.TryEnrichRunAsync(runId, cancellationToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                if (logger.IsEnabled(LogLevel.Warning))
                    logger.LogWarningWithSanitizedUserArg(ex, "Architecture finding confidence enrichment failed after submit for RunId={RunId}; continuing.",
                        runId);
            }

            if (logger.IsEnabled(LogLevel.Information))
                logger.LogInformationAgentResultSubmitted(runId, result.ResultId, result.AgentType, newStatus);
            return new SubmitResultResult(true, result.ResultId, null);
        }
        catch (AgentResultDuplicateConflictException ex)
        {
            await uow.RollbackAsync(cancellationToken);

            return new SubmitResultResult(false, null, ex.Message, ApplicationServiceFailureKind.Conflict);
        }
        catch (Exception ex) when (SqlUniqueConstraintViolationDetector.IsUniqueKeyViolation(ex))
        {
            await uow.RollbackAsync(cancellationToken);

            return new SubmitResultResult(
                false,
                null,
                $"A result for task '{result.TaskId}' has already been submitted for this run.",
                ApplicationServiceFailureKind.Conflict);
        }
        catch
        {
            await uow.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private async Task<ArchitectureRunStatus> SubmitAgentResultPersistAsync(string runId, AgentResult result, IArchLucidUnitOfWork uow,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (uow.SupportsExternalTransaction)
        {
            await resultRepository.CreateAsync(result, cancellationToken, uow.Connection, uow.Transaction);
            // Re-fetch results after insert so concurrent submissions see the full set and only one transition sets ReadyForCommit.
            IReadOnlyList<AgentResult> allResults = await resultRepository.GetByRunIdAsync(scope, runId, cancellationToken, uow.Connection, uow.Transaction);
            return _runStateTransitionService.DeriveStatusAfterResultSubmission(allResults);
        }

        await resultRepository.CreateAsync(result, cancellationToken);
        IReadOnlyList<AgentResult> allResultsMemory = await resultRepository.GetByRunIdAsync(scope, runId, cancellationToken);
        return _runStateTransitionService.DeriveStatusAfterResultSubmission(allResultsMemory);
    }
}
