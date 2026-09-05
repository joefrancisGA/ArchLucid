using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Advisory;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Persistence.Advisory;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Advisory;

public sealed partial class AdvisorySchedulingController
{
    /// <summary>Lists recent architecture digests for the scope (newest first, capped by <paramref name="take" />).</summary>
    /// <param name="take">Maximum digests to return (default 20).</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>
    ///     Persisted <see cref="ArchitectureDigest" /> rows from
    ///     <see cref="IArchitectureDigestRepository.ListByScopeAsync" />.
    /// </returns>
    /// <remarks>
    ///     Populated by scheduled/on-demand scans via <c>AdvisoryScanRunner</c> after
    ///     <see cref="IArchitectureDigestBuilder.Build" />.
    /// </remarks>
    [HttpGet("digests")]
    [ProducesResponseType(typeof(IReadOnlyList<ArchitectureDigest>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ListDigests(
        [FromQuery] int take = 20,
        CancellationToken ct = default)
    {
        take = Math.Clamp(take, 1, PaginationDefaults.MaxPageSize);
        ScopeContext scope = scopeProvider.GetCurrentScope();

        IReadOnlyList<ArchitectureDigest> digests = await digestRepository.ListByScopeAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            take,
            ct);

        foreach (ArchitectureDigest digest in digests)
        {
            try
            {
                await AdvisoryDigestReadSealedManifestHashGuard.EnsureDigestRunSealedOrThrowAsync(
                    digest,
                    scope,
                    authorityQueryService,
                    manifestHashService,
                    ct);
            }
            catch (ConflictException ex)
            {
                return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
            }
        }

        return Ok(digests);
    }

    /// <summary>Gets a single digest by id when it belongs to the current scope.</summary>
    /// <param name="digestId">Primary key of the digest.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The digest body when found and scope matches.</returns>
    /// <remarks>Returns 404 when the id is unknown or tenant/workspace/project do not match the caller's scope.</remarks>
    [HttpGet("digests/{digestId:guid}")]
    [ProducesResponseType(typeof(ArchitectureDigest), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> GetDigest(Guid digestId, CancellationToken ct = default)
    {
        ArchitectureDigest? digest = await digestRepository.GetByIdAsync(digestId, ct);
        if (digest is null)
            return this.NotFoundProblem($"Digest '{digestId}' was not found.", ProblemTypes.ResourceNotFound);

        ScopeContext scope = scopeProvider.GetCurrentScope();
        if (digest.TenantId != scope.TenantId ||
            digest.WorkspaceId != scope.WorkspaceId ||
            digest.ProjectId != scope.ProjectId)
            return this.NotFoundProblem($"Digest '{digestId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound);

        try
        {
            await AdvisoryDigestReadSealedManifestHashGuard.EnsureDigestRunSealedOrThrowAsync(
                digest,
                scope,
                authorityQueryService,
                manifestHashService,
                ct);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }

        return Ok(digest);
    }
}
