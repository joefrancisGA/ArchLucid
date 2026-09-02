using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Architecture;

public interface IArchitectureVersionService
{
    /// <summary>
    ///     Ensures a content-addressed version row exists for the admitted artifact and pins it on the run header.
    /// </summary>
    Task<ArchitectureVersionRecord> EnsureRunVersionPinnedAsync(
        ScopeContext scope,
        Guid runId,
        Guid architectureId,
        ArchitectureRequest request,
        ArchitectureKnowledgeModel? knowledgeModel = null,
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

    public async Task<ArchitectureVersionRecord> EnsureRunVersionPinnedAsync(
        ScopeContext scope,
        Guid runId,
        Guid architectureId,
        ArchitectureRequest request,
        ArchitectureKnowledgeModel? knowledgeModel = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        byte[] intakeHash = ArchitectureVersionContentFingerprint.ComputeIntakeRequestHash(request);
        byte[] artifactHash = ArchitectureVersionContentFingerprint.ComputeArtifactHash(request, knowledgeModel);

        ArchitectureVersionRecord? existing = await _architectureVersionRepository
            .GetByContentHashAsync(scope, architectureId, artifactHash, cancellationToken)
            .ConfigureAwait(false);

        ArchitectureVersionRecord version = existing
            ?? await CreateNextVersionAsync(scope, architectureId, request, artifactHash, intakeHash, cancellationToken)
                .ConfigureAwait(false);

        await PinRunVersionAsync(scope, runId, version.ArchitectureVersionId, cancellationToken).ConfigureAwait(false);

        return version;
    }

    private async Task<ArchitectureVersionRecord> CreateNextVersionAsync(
        ScopeContext scope,
        Guid architectureId,
        ArchitectureRequest request,
        byte[] artifactHash,
        byte[] intakeHash,
        CancellationToken cancellationToken)
    {
        int latest = await _architectureVersionRepository
            .GetLatestVersionNumberAsync(scope, architectureId, cancellationToken)
            .ConfigureAwait(false);

        ArchitectureVersionRecord record = new()
        {
            ArchitectureId = architectureId,
            VersionNumber = latest + 1,
            ContentHashSha256 = artifactHash,
            IntakeRequestHashSha256 = intakeHash,
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
        {
            throw new ArchitecturePinningFailedException(
                $"Architecture version pin failed: run header '{runId:D}' was not found.");
        }

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
