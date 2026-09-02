using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Planning;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Architecture;
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
    TechnologyLedgerRequestSeeder technologyLedgerRequestSeeder,
    TechnologyLedgerEvidenceSeeder technologyLedgerEvidenceSeeder,
    IArchitectureIdentityService? architectureIdentityService,
    IArchitectureVersionService? architectureVersionService,
    IRunPolicyPackPinService runPolicyPackPinService,
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

    private readonly TechnologyLedgerRequestSeeder _technologyLedgerRequestSeeder =
        technologyLedgerRequestSeeder ?? throw new ArgumentNullException(nameof(technologyLedgerRequestSeeder));

    private readonly TechnologyLedgerEvidenceSeeder _technologyLedgerEvidenceSeeder =
        technologyLedgerEvidenceSeeder ?? throw new ArgumentNullException(nameof(technologyLedgerEvidenceSeeder));

    private readonly IArchitectureIdentityService? _architectureIdentityService = architectureIdentityService;

    private readonly IArchitectureVersionService? _architectureVersionService = architectureVersionService;

    private readonly IRunPolicyPackPinService _runPolicyPackPinService =
        runPolicyPackPinService ?? throw new ArgumentNullException(nameof(runPolicyPackPinService));

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
        Guid? excludeRunId = ArchitectureReviewSourceRunResolver.TryResolveSourceRunId(request);

        await _workspaceSystemNameCollisionGuard
            .EnsureAvailableAsync(
                scope,
                request.SystemName,
                WorkspaceSystemNameOccupancyKind.Review,
                excludeRunId: excludeRunId,
                cancellationToken: cancellationToken)
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

        StructuralExecutionModeAdmittanceGuard.EnsureAdmittableOrThrow(header.StructuralExecutionMode);
        await _runPolicyPackPinService.ApplyToRunHeaderAsync(header, scope, cancellationToken).ConfigureAwait(false);
        await _runRepository.UpdateAsync(header, cancellationToken).ConfigureAwait(false);

        string runId = runGuid.ToString("N");
        ArchitectureKnowledgeModel knowledgeModel = _knowledgeModelIntakeBuilder.Build(scope, request, runId);
        string? knowledgeModelId = await TryPersistKnowledgeModelAsync(scope, knowledgeModel, cancellationToken)
            ?? knowledgeModel.ModelId;

        Guid architectureId = await EnsureArchitectureIdentityAsync(
            scope,
            runGuid,
            knowledgeModelId,
            cancellationToken);

        await EnsureArchitectureVersionAsync(
            scope,
            runGuid,
            architectureId,
            request,
            knowledgeModel,
            cancellationToken);

        Guid? architectureVersionId = await TryReadPinnedVersionIdAsync(scope, runGuid, cancellationToken)
            .ConfigureAwait(false);

        await TechnologyLedgerRunCreateSeeding.TrySeedIntakeAsync(
            runId,
            request,
            _technologyLedgerRequestSeeder,
            _technologyLedgerEvidenceSeeder,
            _logger,
            cancellationToken);

        return new ArchitectureSynthesisGenerateResult
        {
            RunId = runId,
            PackageOrigin = ArchitecturePackageOrigin.Created,
            KnowledgeModelId = knowledgeModelId,
            ArchitectureId = architectureId,
            ArchitectureVersionId = architectureVersionId,
        };
    }

    private async Task<Guid?> TryReadPinnedVersionIdAsync(
        ScopeContext scope,
        Guid runGuid,
        CancellationToken cancellationToken)
    {
        Persistence.Models.RunRecord? header =
            await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken).ConfigureAwait(false);

        return header?.ArchitectureVersionId;
    }

    private async Task<Guid> EnsureArchitectureIdentityAsync(
        ScopeContext scope,
        Guid runGuid,
        string? knowledgeModelId,
        CancellationToken cancellationToken)
    {
        if (_architectureIdentityService is null)
        {
            throw new ArchitecturePinningFailedException(
                "Architecture identity service is not registered; synthesis cannot proceed.");
        }

        ArchitectureIdentityRecord? identity = await _architectureIdentityService
            .EnsureCreatedRunIdentityAsync(scope, runGuid, knowledgeModelId, cancellationToken)
            .ConfigureAwait(false);

        if (identity?.ArchitectureId is not Guid architectureId || architectureId == Guid.Empty)
        {
            throw new ArchitecturePinningFailedException(
                $"Architecture identity pin failed for RunId={runGuid:D}.");
        }

        return architectureId;
    }

    private async Task EnsureArchitectureVersionAsync(
        ScopeContext scope,
        Guid runGuid,
        Guid architectureId,
        ArchitectureRequest request,
        ArchitectureKnowledgeModel knowledgeModel,
        CancellationToken cancellationToken)
    {
        if (_architectureVersionService is null)
        {
            throw new ArchitecturePinningFailedException(
                "Architecture version service is not registered; synthesis cannot proceed.");
        }

        try
        {
            await _architectureVersionService
                .EnsureRunVersionPinnedAsync(scope, runGuid, architectureId, request, knowledgeModel, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (ArchitecturePinningFailedException)
        {
            throw;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            throw new ArchitecturePinningFailedException(
                $"Architecture version pin failed for RunId={runGuid:D}.",
                ex);
        }
    }

    private async Task<string?> TryPersistKnowledgeModelAsync(
        ScopeContext scope,
        ArchitectureKnowledgeModel model,
        CancellationToken cancellationToken)
    {
        if (_architectureIntelligencePersistence is null)
            return null;

        try
        {
            await _architectureIntelligencePersistence.SaveModelAsync(model, cancellationToken);
            return model.ModelId;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Architecture knowledge model persistence failed for RunId={RunId}; version fingerprint uses in-memory κ.",
                    model.RunId);
            }

            return null;
        }
    }
}
