using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Planning;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Architecture;

/// <summary>
///     Option K synthesis kernel: draft delegates to <see cref="IArchitectureRequestDraftService" />;
///     generate persists a Created-origin run header without starting the authority pipeline or
///     the four-agent review execute loop.
/// </summary>
public sealed class ArchitectureSynthesisKernel(
    IArchitectureRequestDraftService architectureRequestDraftService,
    IArchitectureRequestRepository requestRepository,
    IRunRepository runRepository,
    IScopeContextProvider scopeContextProvider,
    IRequestContentSafetyPrecheck requestContentSafetyPrecheck,
    IWorkspaceSystemNameCollisionGuard workspaceSystemNameCollisionGuard,
    IArchitectureKnowledgeModelIntakeBuilder knowledgeModelIntakeBuilder,
    IArchitectureIntelligencePersistence? architectureIntelligencePersistence,
    ILogger<ArchitectureSynthesisKernel> logger,
    TimeProvider timeProvider) : IArchitectureSynthesisKernel
{
    private readonly IArchitectureRequestDraftService _architectureRequestDraftService =
        architectureRequestDraftService ?? throw new ArgumentNullException(nameof(architectureRequestDraftService));

    private readonly IArchitectureRequestRepository _requestRepository =
        requestRepository ?? throw new ArgumentNullException(nameof(requestRepository));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRequestContentSafetyPrecheck _requestContentSafetyPrecheck =
        requestContentSafetyPrecheck ?? throw new ArgumentNullException(nameof(requestContentSafetyPrecheck));

    private readonly IWorkspaceSystemNameCollisionGuard _workspaceSystemNameCollisionGuard =
        workspaceSystemNameCollisionGuard ?? throw new ArgumentNullException(nameof(workspaceSystemNameCollisionGuard));

    private readonly IArchitectureKnowledgeModelIntakeBuilder _knowledgeModelIntakeBuilder =
        knowledgeModelIntakeBuilder ?? throw new ArgumentNullException(nameof(knowledgeModelIntakeBuilder));

    private readonly IArchitectureIntelligencePersistence? _architectureIntelligencePersistence =
        architectureIntelligencePersistence;

    private readonly ILogger<ArchitectureSynthesisKernel> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    /// <inheritdoc />
    public Task<DraftArchitectureRequestResponse> DraftAsync(
        DraftArchitectureRequestInput input,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(input);

        return _architectureRequestDraftService.DraftAsync(input, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<ArchitectureSynthesisGenerateResult> GenerateAsync(
        ArchitectureRequest request,
        CreateRunIdempotencyState? idempotency,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        _ = idempotency;

        RequestContentSafetyResult safety =
            await _requestContentSafetyPrecheck.EvaluateAsync(request, cancellationToken);

        if (!safety.IsAllowed)
            throw new RequestContentSafetyRejectedException(safety.Reasons);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        await _workspaceSystemNameCollisionGuard
            .EnsureAvailableAsync(scope, request.SystemName, cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        ArchitectureRequest? existing =
            await _requestRepository.GetByIdAsync(request.RequestId, cancellationToken);

        if (existing is null)
            await _requestRepository.CreateAsync(request, cancellationToken);

        Guid runGuid = Guid.NewGuid();
        DateTime createdUtc = _timeProvider.GetUtcNow().UtcDateTime;
        string projectSlug = string.IsNullOrWhiteSpace(request.SystemName)
            ? request.RequestId
            : request.SystemName;

        RunRecord header = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            RunId = runGuid,
            ProjectId = projectSlug,
            Description = request.Description,
            CreatedUtc = createdUtc,
            ArchitectureRequestId = request.RequestId,
            LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
            StructuralExecutionMode = StructuralExecutionMode.Simulator,
            PackageOrigin = ArchitecturePackageOrigin.Created
        };

        await _runRepository.SaveAsync(header, cancellationToken);

        string runId = runGuid.ToString("N");
        string? knowledgeModelId = await TryPersistKnowledgeModelAsync(scope, request, runId, cancellationToken);

        return new ArchitectureSynthesisGenerateResult
        {
            RunId = runId,
            PackageOrigin = ArchitecturePackageOrigin.Created,
            KnowledgeModelId = knowledgeModelId,
        };
    }

    private async Task<string?> TryPersistKnowledgeModelAsync(
        ScopeContext scope,
        ArchitectureRequest request,
        string runId,
        CancellationToken cancellationToken)
    {
        if (_architectureIntelligencePersistence is null)
            return null;

        try
        {
            ArchitectureKnowledgeModel model = _knowledgeModelIntakeBuilder.Build(scope, request, runId);
            await _architectureIntelligencePersistence.SaveModelAsync(model, cancellationToken);
            return model.ModelId;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Architecture knowledge model persistence failed for RunId={RunId}; synthesis continues.",
                    runId);
            }

            return null;
        }
    }
}
