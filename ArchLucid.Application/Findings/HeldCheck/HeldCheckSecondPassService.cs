using ArchLucid.Application.Architecture;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Ports;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Findings.HeldCheck;

/// <inheritdoc cref="IHeldCheckSecondPassService" />
public sealed class HeldCheckSecondPassService(
    IRunRepository runRepository,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    IContextSnapshotRepository contextSnapshotRepository,
    IGraphSnapshotRepository graphSnapshotRepository,
    IFindingAnalysisContextBuilder findingAnalysisContextBuilder,
    IFindingsOrchestrator findingsOrchestrator,
    IArchitectureKnowledgeModelAccess? knowledgeModelAccess = null,
    IArchitectureRequestRepository? architectureRequestRepository = null,
    ILogger<HeldCheckSecondPassService>? logger = null) : IHeldCheckSecondPassService
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly IContextSnapshotRepository _contextSnapshotRepository =
        contextSnapshotRepository ?? throw new ArgumentNullException(nameof(contextSnapshotRepository));

    private readonly IGraphSnapshotRepository _graphSnapshotRepository =
        graphSnapshotRepository ?? throw new ArgumentNullException(nameof(graphSnapshotRepository));

    private readonly IFindingAnalysisContextBuilder _findingAnalysisContextBuilder =
        findingAnalysisContextBuilder ?? throw new ArgumentNullException(nameof(findingAnalysisContextBuilder));

    private readonly IFindingsOrchestrator _findingsOrchestrator =
        findingsOrchestrator ?? throw new ArgumentNullException(nameof(findingsOrchestrator));

    private readonly IArchitectureKnowledgeModelAccess? _knowledgeModelAccess = knowledgeModelAccess;

    private readonly IArchitectureRequestRepository? _architectureRequestRepository = architectureRequestRepository;

    private readonly ILogger<HeldCheckSecondPassService>? _logger = logger;

    public async Task<HeldCheckSecondPassResult> TryRunAsync(
        ScopeContext scope,
        Guid runId,
        HeldCheckInputCode inputCode,
        Guid ingestedPackageId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        RunRecord? run = await _runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        if (run is null)
        {
            return HeldCheckSecondPassResult.NoOp(inputCode);
        }

        // TB-310 / ADR 0039: committed runs cannot repoint FindingsSnapshotId — second pass is pre-commit only.
        if (run.GoldenManifestId is not null)
        {
            return new HeldCheckSecondPassResult
            {
                InputCode = inputCode,
                Status = HeldCheckSecondPassStatus.NotEligible,
            };
        }

        if (!run.FindingsSnapshotId.HasValue || run.FindingsSnapshotId.Value == Guid.Empty)
        {
            return new HeldCheckSecondPassResult
            {
                InputCode = inputCode,
                Status = HeldCheckSecondPassStatus.NoPriorLedger,
            };
        }

        Guid previousSnapshotId = run.FindingsSnapshotId.Value;

        FindingsSnapshot? previousSnapshot = await _findingsSnapshotRepository
            .GetByIdAsync(scope, previousSnapshotId, cancellationToken)
            .ConfigureAwait(false);

        if (previousSnapshot is null)
        {
            return new HeldCheckSecondPassResult
            {
                InputCode = inputCode,
                Status = HeldCheckSecondPassStatus.NoPriorLedger,
                PreviousSnapshotId = previousSnapshotId,
            };
        }

        IReadOnlyList<HeldCheckLedgerRollupEntry>? priorLedgerEntries =
            previousSnapshot.InsightDensityCuration?.HeldCheckLedgerEntries;

        HeldCheckLedgerRollupEntry? priorEntry = priorLedgerEntries?
            .FirstOrDefault(entry => entry.InputCode == inputCode);

        if (priorEntry is null || priorEntry.EngineCount == 0)
        {
            return new HeldCheckSecondPassResult
            {
                InputCode = inputCode,
                Status = HeldCheckSecondPassStatus.NoPriorLedger,
                PreviousSnapshotId = previousSnapshotId,
            };
        }

        if (!run.ContextSnapshotId.HasValue || run.ContextSnapshotId.Value == Guid.Empty
            || !run.GraphSnapshotId.HasValue || run.GraphSnapshotId.Value == Guid.Empty)
        {
            return new HeldCheckSecondPassResult
            {
                InputCode = inputCode,
                Status = HeldCheckSecondPassStatus.NotEligible,
                PreviousSnapshotId = previousSnapshotId,
            };
        }

        ContextSnapshot? contextSnapshot = await _contextSnapshotRepository
            .GetByIdAsync(scope.ToReadScope(), run.ContextSnapshotId.Value, cancellationToken)
            .ConfigureAwait(false);

        GraphSnapshot? graphSnapshot = await _graphSnapshotRepository
            .GetByIdAsync(scope, run.GraphSnapshotId.Value, cancellationToken)
            .ConfigureAwait(false);

        if (contextSnapshot is null || graphSnapshot is null)
        {
            return new HeldCheckSecondPassResult
            {
                InputCode = inputCode,
                Status = HeldCheckSecondPassStatus.NotEligible,
                PreviousSnapshotId = previousSnapshotId,
            };
        }

        ArchitectureKnowledgeModel? knowledgeModel = null;

        if (_knowledgeModelAccess is not null)
        {
            knowledgeModel = await _knowledgeModelAccess
                .GetForRunAsync(scope, runId, cancellationToken)
                .ConfigureAwait(false);
        }

        ArchitectureRequest? request = null;

        if (_architectureRequestRepository is not null
            && !string.IsNullOrWhiteSpace(run.ArchitectureRequestId))
        {
            request = await _architectureRequestRepository
                .GetByIdAsync(run.ArchitectureRequestId, cancellationToken)
                .ConfigureAwait(false);
        }

        FindingAnalysisContext analysisContext = await _findingAnalysisContextBuilder
            .BuildForHeldCheckSecondPassAsync(
                scope,
                runId,
                contextSnapshot,
                knowledgeModel,
                request,
                inputCode,
                ingestedPackageId,
                cancellationToken)
            .ConfigureAwait(false);

        FindingsSnapshot newSnapshot = await _findingsOrchestrator
            .GenerateFindingsSnapshotAsync(
                runId,
                contextSnapshot.SnapshotId,
                graphSnapshot,
                cancellationToken,
                analysisContext)
            .ConfigureAwait(false);

        HeldCheckSecondPassDelta delta = HeldCheckSecondPassDeltaCalculator.Compute(
            priorLedgerEntries,
            inputCode,
            newSnapshot);

        HeldCheckSecondPassStatus status = delta.UnblockedEngineTypes.Count == 0
            ? HeldCheckSecondPassStatus.NoNewFindings
            : HeldCheckSecondPassStatus.Completed;

        newSnapshot.InsightDensityCuration ??= new InsightDensityCurationSummary();
        newSnapshot.InsightDensityCuration.HeldCheckSecondPass = new HeldCheckSecondPassSummary
        {
            InputCode = inputCode,
            Status = status,
            UnblockedEngineCount = delta.UnblockedEngineTypes.Count,
            NewDecisionGradeCount = delta.NewDecisionGradeCount,
        };

        await _findingsSnapshotRepository.SaveAsync(newSnapshot, cancellationToken).ConfigureAwait(false);

        run.FindingsSnapshotId = newSnapshot.FindingsSnapshotId;
        await _runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);

        if (_logger is not null && _logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Held-check second pass {Status} for RunId={RunId} InputCode={InputCode} UnblockedEngines={UnblockedCount} NewDecisionGrade={DecisionGradeCount}",
                status,
                runId,
                inputCode,
                delta.UnblockedEngineTypes.Count,
                delta.NewDecisionGradeCount);
        }

        return new HeldCheckSecondPassResult
        {
            InputCode = inputCode,
            Status = status,
            PreviousSnapshotId = previousSnapshotId,
            NewSnapshotId = newSnapshot.FindingsSnapshotId,
            UnblockedEngineTypes = delta.UnblockedEngineTypes,
            NewDecisionGradeCount = delta.NewDecisionGradeCount,
        };
    }
}
