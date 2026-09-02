using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Architecture;

public interface IArchitectureVersionService
{
    /// <summary>
    ///     Ensures a content-addressed version row exists for the request body and pins it on the run header.
    /// </summary>
    Task<ArchitectureVersionRecord?> EnsureRunVersionPinnedAsync(
        ScopeContext scope,
        Guid runId,
        Guid architectureId,
        ArchitectureRequest request,
        CancellationToken cancellationToken = default);
}

public sealed class ArchitectureVersionService(
    IArchitectureVersionRepository architectureVersionRepository,
    IRunRepository runRepository,
    ILogger<ArchitectureVersionService> logger,
    TimeProvider timeProvider) : IArchitectureVersionService
{
    private readonly IArchitectureVersionRepository _architectureVersionRepository =
        architectureVersionRepository ?? throw new ArgumentNullException(nameof(architectureVersionRepository));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly ILogger<ArchitectureVersionService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task<ArchitectureVersionRecord?> EnsureRunVersionPinnedAsync(
        ScopeContext scope,
        Guid runId,
        Guid architectureId,
        ArchitectureRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        byte[] contentHash = ArchitectureRunIdempotencyHashing.FingerprintRequest(request);

        ArchitectureVersionRecord? existing = await _architectureVersionRepository
            .GetByContentHashAsync(scope, architectureId, contentHash, cancellationToken)
            .ConfigureAwait(false);

        ArchitectureVersionRecord version = existing
            ?? await CreateNextVersionAsync(scope, architectureId, request, contentHash, cancellationToken)
                .ConfigureAwait(false);

        await PinRunVersionAsync(scope, runId, version.ArchitectureVersionId, cancellationToken).ConfigureAwait(false);

        return version;
    }

    private async Task<ArchitectureVersionRecord> CreateNextVersionAsync(
        ScopeContext scope,
        Guid architectureId,
        ArchitectureRequest request,
        byte[] contentHash,
        CancellationToken cancellationToken)
    {
        int latest = await _architectureVersionRepository
            .GetLatestVersionNumberAsync(scope, architectureId, cancellationToken)
            .ConfigureAwait(false);

        ArchitectureVersionRecord record = new()
        {
            ArchitectureId = architectureId,
            VersionNumber = latest + 1,
            ContentHashSha256 = contentHash,
            SourceRequestId = request.RequestId,
            CreatedUtc = _timeProvider.GetUtcNow().UtcDateTime,
        };

        return await _architectureVersionRepository.CreateAsync(scope, record, cancellationToken).ConfigureAwait(false);
    }

    private async Task PinRunVersionAsync(
        ScopeContext scope,
        Guid runId,
        Guid architectureVersionId,
        CancellationToken cancellationToken)
    {
        Persistence.Models.RunRecord? header =
            await _runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        if (header is null)
            return;

        if (header.ArchitectureVersionId == architectureVersionId)
            return;

        header.ArchitectureVersionId = architectureVersionId;
        await _runRepository.UpdateAsync(header, cancellationToken).ConfigureAwait(false);

        if (_logger.IsEnabled(LogLevel.Debug))
        {
            _logger.LogDebug(
                "Pinned architecture version {ArchitectureVersionId} on run {RunId}.",
                architectureVersionId,
                runId);
        }
    }
}
