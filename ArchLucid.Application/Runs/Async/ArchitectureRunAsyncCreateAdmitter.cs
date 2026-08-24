using System.Security.Cryptography;

using ArchLucid.Application.Common;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Async;

/// <summary>
///     Fast Tier C create admit: request + run stub + idempotency only. Heavy coordination runs on the async worker.
/// </summary>
public sealed class ArchitectureRunAsyncCreateAdmitter(
    IArchitectureRequestRepository requestRepository,
    IRunRepository runRepository,
    IArchitectureRunIdempotencyRepository architectureRunIdempotencyRepository,
    IArchLucidUnitOfWorkFactory unitOfWorkFactory,
    IScopeContextProvider scopeContextProvider,
    TimeProvider timeProvider,
    ILogger<ArchitectureRunAsyncCreateAdmitter> logger) : IArchitectureRunAsyncCreateAdmitter
{
    private readonly IArchitectureRequestRepository _requestRepository =
        requestRepository ?? throw new ArgumentNullException(nameof(requestRepository));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IArchitectureRunIdempotencyRepository _architectureRunIdempotencyRepository =
        architectureRunIdempotencyRepository
        ?? throw new ArgumentNullException(nameof(architectureRunIdempotencyRepository));

    private readonly IArchLucidUnitOfWorkFactory _unitOfWorkFactory =
        unitOfWorkFactory ?? throw new ArgumentNullException(nameof(unitOfWorkFactory));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private readonly ILogger<ArchitectureRunAsyncCreateAdmitter> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<ArchitectureRunAsyncCreateAdmitResult> AdmitAsync(
        ArchitectureRequest request,
        CreateRunIdempotencyState? idempotency,
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(scope);

        QuickStartIntakeRequestEnricher.EnrichIfQuickStart(request);

        if (idempotency is not null)
        {
            ArchitectureRunAsyncCreateAdmitResult? replay = await TryResolveIdempotentAdmitAsync(idempotency, cancellationToken);

            if (replay is not null)
                return replay;
        }

        Guid runId = Guid.NewGuid();
        string runIdText = runId.ToString("N");
        DateTime createdUtc = _timeProvider.GetUtcNow().UtcDateTime;

        await using IArchLucidUnitOfWork uow = await _unitOfWorkFactory.CreateAsync(cancellationToken);

        try
        {
            if (uow.SupportsExternalTransaction)
            {
                await _requestRepository.CreateAsync(request, cancellationToken, uow.Connection, uow.Transaction);

                RunRecord stub = BuildRunStub(runId, request, scope, createdUtc);
                await _runRepository.SaveAsync(stub, cancellationToken, uow.Connection, uow.Transaction);

                if (idempotency is not null)
                {
                    bool inserted = await _architectureRunIdempotencyRepository.TryInsertAsync(
                        idempotency.TenantId,
                        idempotency.WorkspaceId,
                        idempotency.ProjectId,
                        idempotency.IdempotencyKeyHash,
                        idempotency.RequestFingerprint,
                        runIdText,
                        cancellationToken,
                        uow.Connection,
                        uow.Transaction);

                    if (!inserted)
                    {
                        await uow.RollbackAsync(cancellationToken);

                        ArchitectureRunAsyncCreateAdmitResult? raceWinner =
                            await TryResolveIdempotentAdmitAsync(idempotency, cancellationToken);

                        if (raceWinner is null)
                            throw new InvalidOperationException("Idempotency insert failed but no winning row was found; retry the request.");

                        return raceWinner;
                    }
                }
            }
            else
            {
                await _requestRepository.CreateAsync(request, cancellationToken);

                RunRecord stub = BuildRunStub(runId, request, scope, createdUtc);
                await _runRepository.SaveAsync(stub, cancellationToken);

                if (idempotency is not null)
                {
                    bool inserted = await _architectureRunIdempotencyRepository.TryInsertAsync(
                        idempotency.TenantId,
                        idempotency.WorkspaceId,
                        idempotency.ProjectId,
                        idempotency.IdempotencyKeyHash,
                        idempotency.RequestFingerprint,
                        runIdText,
                        cancellationToken);

                    if (!inserted)
                    {
                        ArchitectureRunAsyncCreateAdmitResult? raceWinner =
                            await TryResolveIdempotentAdmitAsync(idempotency, cancellationToken);

                        if (raceWinner is null)
                            throw new InvalidOperationException("Idempotency insert failed but no winning row was found; retry the request.");

                        return raceWinner;
                    }
                }
            }

            await uow.CommitAsync(cancellationToken);
        }
        catch
        {
            await uow.RollbackAsync(cancellationToken);
            throw;
        }

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Async create admitted: RunId={RunId}, RequestId={RequestId}, SystemName={SystemName}",
                runId,
                request.RequestId,
                request.SystemName);
        }

        return new ArchitectureRunAsyncCreateAdmitResult(runId, IdempotentReplay: false);
    }

    private async Task<ArchitectureRunAsyncCreateAdmitResult?> TryResolveIdempotentAdmitAsync(
        CreateRunIdempotencyState idempotency,
        CancellationToken cancellationToken)
    {
        ArchitectureRunIdempotencyLookup? existing = await _architectureRunIdempotencyRepository.TryGetAsync(
            idempotency.TenantId,
            idempotency.WorkspaceId,
            idempotency.ProjectId,
            idempotency.IdempotencyKeyHash,
            cancellationToken);

        if (existing is null)
            return null;

        if (!CryptographicOperations.FixedTimeEquals(existing.RequestFingerprint, idempotency.RequestFingerprint))
            throw new ConflictException("The Idempotency-Key was already used with a different request body.");

        if (!Guid.TryParseExact(existing.RunId, "N", out Guid parsedRunId)
            && !Guid.TryParse(existing.RunId, out parsedRunId))
        {
            throw new InvalidOperationException($"Idempotent run id '{existing.RunId}' is not a valid GUID.");
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? header = await _runRepository.GetByIdAsync(scope, parsedRunId, cancellationToken);

        if (header is null)
            throw new InvalidOperationException($"Run '{existing.RunId}' from idempotency store was not found.");

        return new ArchitectureRunAsyncCreateAdmitResult(parsedRunId, IdempotentReplay: true);
    }

    private static RunRecord BuildRunStub(
        Guid runId,
        ArchitectureRequest request,
        ScopeContext scope,
        DateTime createdUtc)
    {
        return new RunRecord
        {
            RunId = runId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = request.SystemName,
            Description = request.Description,
            ArchitectureRequestId = request.RequestId,
            CreatedUtc = createdUtc,
            LegacyRunStatus = ArchitectureRunStatus.Created.ToString(),
            StructuralExecutionMode = StructuralExecutionMode.Simulator
        };
    }
}
