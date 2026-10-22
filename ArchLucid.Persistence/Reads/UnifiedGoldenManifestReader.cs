using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Reads;

/// <inheritdoc cref="IUnifiedGoldenManifestReader" />
/// <remarks>
///     Authority-only after ADR 0030 PR A3 (2026-04-24). The legacy
///     <c>ICoordinatorGoldenManifestRepository</c> fallback was retired together with the
///     interface itself — the underlying SQL table <c>dbo.GoldenManifestVersions</c> had already
///     been dropped in PR A4 (migration 111), so the fallback was inert dead code that would
///     have thrown at runtime. The reader continues to project authority-shape
///     <see cref="ArchLucid.Core.Manifest.ManifestDocument" /> rows into the public
///     <see cref="GoldenManifest" /> contract via <see cref="IAuthorityCommitProjectionBuilder" />.
/// </remarks>
public sealed class UnifiedGoldenManifestReader(
    IRunRepository runRepository,
    IGoldenManifestRepository authorityGoldenManifests,
    IAuthorityCommitProjectionBuilder projectionBuilder,
    IArchitectureRequestRepository requestRepository,
    IScopeContextProvider scopeContextProvider) : IUnifiedGoldenManifestReader
{
    private readonly IGoldenManifestRepository _authorityGoldenManifests =
        authorityGoldenManifests ?? throw new ArgumentNullException(nameof(authorityGoldenManifests));

    private readonly IAuthorityCommitProjectionBuilder _projectionBuilder =
        projectionBuilder ?? throw new ArgumentNullException(nameof(projectionBuilder));

    private readonly IArchitectureRequestRepository _requestRepository =
        requestRepository ?? throw new ArgumentNullException(nameof(requestRepository));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    /// <inheritdoc />
    public async Task<GoldenManifest?> GetByVersionAsync(string manifestVersion,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        ArchLucid.Core.Manifest.ManifestDocument? authorityModel =
            await _authorityGoldenManifests
                .GetByContractManifestVersionAsync(scope, manifestVersion, cancellationToken)
                .ConfigureAwait(false);

        if (authorityModel is null)
            return null;

        RunRecord? run = await _runRepository.GetByIdAsync(scope, authorityModel.RunId, cancellationToken)
            .ConfigureAwait(false);

        if (run is null)
        {
            return await _projectionBuilder
                .BuildAsync(
                    authorityModel,
                    new AuthorityCommitProjectionInput { SystemName = "Unknown" },
                    cancellationToken)
                .ConfigureAwait(false);
        }

        AuthorityCommitProjectionInput input =
            await BuildProjectionInputAsync(run, cancellationToken).ConfigureAwait(false);

        return await _projectionBuilder
            .BuildAsync(authorityModel, input, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task<GoldenManifest?> ReadByRunIdAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        RunRecord? run = await _runRepository.GetByIdAsync(scope, runId, cancellationToken);

        if (run is null)
            return null;

        if (run.GoldenManifestId is { } goldenId)
        {
            ArchLucid.Core.Manifest.ManifestDocument? authorityModel =
                await _authorityGoldenManifests.GetByIdAsync(scope, goldenId, cancellationToken);

            if (authorityModel is not null)
            {
                AuthorityCommitProjectionInput input =
                    await BuildProjectionInputAsync(run, cancellationToken).ConfigureAwait(false);

                return await _projectionBuilder
                    .BuildAsync(authorityModel, input, cancellationToken)
                    .ConfigureAwait(false);
            }
        }

        string runKey = runId.ToString("N");
        string manifestVersionKey = string.IsNullOrWhiteSpace(run.CurrentManifestVersion)
            ? $"v1-{runKey}"
            : run.CurrentManifestVersion!;

        ArchLucid.Core.Manifest.ManifestDocument? authorityByVersion =
            await _authorityGoldenManifests
                .GetByContractManifestVersionAsync(scope, manifestVersionKey, cancellationToken)
                .ConfigureAwait(false);

        if (authorityByVersion is null)
            return null;

        AuthorityCommitProjectionInput fallbackInput =
            await BuildProjectionInputAsync(run, cancellationToken).ConfigureAwait(false);

        return await _projectionBuilder
            .BuildAsync(authorityByVersion, fallbackInput, cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task<string> ResolveSystemNameAsync(RunRecord run, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(run.ArchitectureRequestId))
            return !string.IsNullOrWhiteSpace(run.ProjectId) ? run.ProjectId : "Unknown";

        ArchitectureRequest? request =
            await _requestRepository.GetByIdAsync(run.ArchitectureRequestId, cancellationToken);

        if (request is not null && !string.IsNullOrWhiteSpace(request.SystemName))
            return request.SystemName;

        return !string.IsNullOrWhiteSpace(run.ProjectId) ? run.ProjectId : "Unknown";
    }

    private async Task<AuthorityCommitProjectionInput> BuildProjectionInputAsync(
        RunRecord run,
        CancellationToken cancellationToken)
    {
        string systemName = await ResolveSystemNameAsync(run, cancellationToken).ConfigureAwait(false);
        ArchitectureRequest? request = string.IsNullOrWhiteSpace(run.ArchitectureRequestId)
            ? null
            : await _requestRepository.GetByIdAsync(run.ArchitectureRequestId, cancellationToken).ConfigureAwait(false);

        return new AuthorityCommitProjectionInput
        {
            SystemName = systemName,
            DraftActors = request?.DraftActors ?? [],
        };
    }
}
