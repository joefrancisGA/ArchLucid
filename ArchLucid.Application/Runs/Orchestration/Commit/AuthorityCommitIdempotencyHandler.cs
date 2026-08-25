using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;

using Cm = ArchLucid.Contracts.Manifest;
using DecisionTraceDto = ArchLucid.Contracts.Persistence.DecisionTraces.DecisionTraceDto;
using DecisioningIdTraceRepository = ArchLucid.Core.Persistence.Ports.IDecisionTraceRepository;
using DecisioningIGoldenManifestRepository = ArchLucid.Core.Manifest.IGoldenManifestRepository;

namespace ArchLucid.Application.Runs.Orchestration.Commit;

/// <inheritdoc cref="IAuthorityCommitIdempotencyHandler" />
public sealed class AuthorityCommitIdempotencyHandler(
    IScopeContextProvider scopeContextProvider,
    IArchitectureRequestRepository requestRepository,
    DecisioningIGoldenManifestRepository goldenManifestRepository,
    DecisioningIdTraceRepository decisionTraceRepository,
    IAuthorityCommitProjectionBuilder projectionBuilder,
    PostCommitProjectionEnqueuer postCommitProjectionEnqueuer,
    ILogger<AuthorityCommitIdempotencyHandler> logger) : IAuthorityCommitIdempotencyHandler
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IArchitectureRequestRepository _requestRepository =
        requestRepository ?? throw new ArgumentNullException(nameof(requestRepository));

    private readonly DecisioningIGoldenManifestRepository _goldenManifestRepository =
        goldenManifestRepository ?? throw new ArgumentNullException(nameof(goldenManifestRepository));

    private readonly DecisioningIdTraceRepository _decisionTraceRepository =
        decisionTraceRepository ?? throw new ArgumentNullException(nameof(decisionTraceRepository));

    private readonly IAuthorityCommitProjectionBuilder _projectionBuilder =
        projectionBuilder ?? throw new ArgumentNullException(nameof(projectionBuilder));

    private readonly PostCommitProjectionEnqueuer _postCommitProjectionEnqueuer =
        postCommitProjectionEnqueuer ?? throw new ArgumentNullException(nameof(postCommitProjectionEnqueuer));

    private readonly ILogger<AuthorityCommitIdempotencyHandler> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<CommitRunResult?> TryReturnCommittedAsync(
        ArchitectureRun run,
        string runId,
        CancellationToken cancellationToken)
    {
        if (run.Status is not ArchitectureRunStatus.Committed)
            return null;

        if (run.GoldenManifestId is not { } goldenId)
            return null;

        if (run.DecisionTraceId is not { } traceId)
            throw new ConflictException($"Run '{runId}' is already committed (architecture run) but DecisionTraceId is missing on the run record.");
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        ManifestDocument? manifestModel = await _goldenManifestRepository.GetByIdAsync(scope, goldenId, cancellationToken);

        if (manifestModel is null)
            throw new ConflictException(
                $"Run '{runId}' is already committed but the golden manifest '{goldenId:D}' could not be loaded for idempotent replay.");
        DecisionTraceDto? traceDto = await _decisionTraceRepository.GetByIdAsync(scope, traceId, cancellationToken);

        if (traceDto is null)
            throw new ConflictException($"Run '{runId}' is already committed but the decision trace '{traceId:D}' could not be loaded for idempotent replay.");
        ArchitectureRequest request = await _requestRepository.GetByIdAsync(run.RequestId, cancellationToken) ??
                                      throw new InvalidOperationException($"Request '{run.RequestId}' not found.");
        Cm.GoldenManifest contract = await _projectionBuilder.BuildAsync(
            manifestModel,
            new AuthorityCommitProjectionInput { SystemName = request.SystemName },
            cancellationToken);
        IReadOnlyList<string> storedGaps = AuthorityCommitTraceabilityRules.GetLinkageGaps(
            contract,
            [DecisionTraceRecordMapper.ToDomain(traceDto)]);

        if (storedGaps.Count > 0)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(
                    "Committed run (authority) {RunId} has manifest/trace linkage gaps: {Gaps}",
                    LogSanitizer.Sanitize(runId),
                    string.Join("; ", storedGaps));
        }

        if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation(
                "Commit run idempotent return (authority): RunId={RunId} ManifestId={ManifestId} TraceId={TraceId}",
                LogSanitizer.Sanitize(runId),
                goldenId.ToString("D"),
                traceId.ToString("D"));

        if (Guid.TryParseExact(runId, "N", out Guid runGuid) || Guid.TryParse(runId, out runGuid))
        {
            await _postCommitProjectionEnqueuer.EnqueueDecisionEngineV2NodeMaterializationAsync(runGuid, scope, cancellationToken);
        }

        return new CommitRunResult
        {
            Manifest = contract,
            DecisionTraces = [traceDto],
            Warnings = manifestModel.Warnings.Count == 0 ? [] : [.. manifestModel.Warnings]
        };
    }
}
