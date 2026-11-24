using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class ArtifactExportController
{
    /// <summary>
    ///     Maps artifact export <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapArtifactExportSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);

    /// <summary>
    /// Reuse the established architecture-sharing decision before reading
    /// run-derived artifacts. General ReadAuthority and a valid sealed hash
    /// are independent requirements, not substitutes for sharing permission.
    /// </summary>
    private Task<IActionResult?> EnsureArtifactRunShareReadAllowedAsync(
        ScopeContext scope, Guid runId, CancellationToken ct) =>
        _architectureShareAccessGate.EnsureRunReadAllowedAsync(this, User, scope, runId, ct);

    /// <summary>
    /// Resolve only the manifest-to-run identity before authorization, then
    /// hydrate the scoped summary. Denials never reveal the linked run ID.
    /// </summary>
    private async Task<(ManifestSummaryDto? Summary, IActionResult? Rejection)> ResolveAuthorizedArtifactManifestAsync(
        ScopeContext scope, Guid manifestId, CancellationToken ct)
    {
        IActionResult NotFound() =>
            this.NotFoundProblem($"Manifest '{manifestId}' was not found in the current scope.",
                ProblemTypes.ManifestNotFound);

        if (manifestId == Guid.Empty)
            return (null, NotFound());

        Guid? linkedRunId = await authorityQueryService.GetRunIdByManifestIdAsync(scope, manifestId, ct);
        if (linkedRunId is not Guid runId || runId == Guid.Empty)
            return (null, NotFound());

        IActionResult? denied = await EnsureArtifactRunShareReadAllowedAsync(scope, runId, ct);
        if (denied is not null)
            return (null, NotFound());

        ManifestSummaryDto? summary = await authorityQueryService.GetManifestSummaryAsync(scope, manifestId, ct);
        if (summary is null || summary.ManifestId != manifestId || summary.RunId != runId)
            return (null, NotFound());

        return (summary, null);
    }

    /// <summary>
    /// Bind the requested manifest to its authorized run and verify its own
    /// sealed hash; historical IDs need not equal the current pinned ID.
    /// The pinned current manifest is also checked for integrity.
    /// </summary>
    private async Task<IActionResult?> EnsureExactArtifactManifestSealedReadAsync(
        ScopeContext scope, Guid manifestId, ManifestSummaryDto summary,
        RunDetailDto? manifestDetail, CancellationToken ct)
    {
        if (manifestDetail?.Run is null ||
            manifestDetail.Run.RunId != summary.RunId ||
            manifestDetail.GoldenManifest is null ||
            manifestDetail.Run.GoldenManifestId != manifestDetail.GoldenManifest.ManifestId ||
            manifestDetail.GoldenManifest.RunId != summary.RunId)
        {
            return MapArtifactExportSealedManifestConflict(
                new ConflictException($"Manifest '{manifestId}' has no verifiable committed run binding."));
        }

        var current = manifestDetail.GoldenManifest;
        var requested = current.ManifestId == manifestId
            ? current
            : await authorityQueryService.GetManifestForSummaryVerificationAsync(scope, manifestId, ct);

        if (requested is null ||
            requested.ManifestId != manifestId ||
            requested.RunId != summary.RunId ||
            requested.TenantId != scope.TenantId ||
            requested.WorkspaceId != scope.WorkspaceId ||
            requested.ProjectId != scope.ProjectId ||
            !string.Equals(requested.ManifestHash, summary.ManifestHash, StringComparison.OrdinalIgnoreCase))
        {
            return MapArtifactExportSealedManifestConflict(
                new ConflictException($"Manifest '{manifestId}' exact identity, scope, run or hash binding failed."));
        }

        IActionResult? pinnedConflict = EnsureSealedManifestHashOrConflict(current, summary.RunId.ToString("D"));
        if (pinnedConflict is not null)
            return pinnedConflict;

        if (!ReferenceEquals(requested, current))
            return EnsureSealedManifestHashOrConflict(requested, summary.RunId.ToString("D"));

        return null;
    }

    /// <summary>Wave-21 suggestion 208: signed review record reads fail-closed when sealed manifest hash is missing or divergent.</summary>
    private IActionResult? EnsureSealedManifestHashOrConflict(ManifestDocument? manifest, string runIdLabel)
    {
        if (manifest is null)
        {
            return MapArtifactExportSealedManifestConflict(
                new ConflictException(
                    $"Signed review record read blocked for run '{runIdLabel}': committed golden manifest is missing for sealed manifest hash verification."));
        }
        try
        {
            SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(
                manifest,
                runIdLabel,
                manifestHashService);
        }
        catch (ConflictException ex)
        {
            return MapArtifactExportSealedManifestConflict(ex);
        }

        return null;
    }

    private IActionResult? EnsureAuthorityLifecycleCompleteOrConflict(RunDetailDto runDetail, Guid runId)
    {
        try
        {
            AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow(
                AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(runDetail.Run),
                runId.ToString("D"));
        }
        catch (ConflictException ex)
        {
            return MapArtifactExportSealedManifestConflict(ex);
        }

        return null;
    }

    private IActionResult? EnsureManifestRunLifecycleCompleteOrConflict(RunDetailDto? runDetail, Guid runId) =>
        runDetail is null ? null : EnsureAuthorityLifecycleCompleteOrConflict(runDetail, runId);

    private async Task<IActionResult?> EnsureRunSealedManifestHashOrConflictAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken)
    {
        RunDetailDto? detail;

        try
        {
            detail = await authorityQueryService.GetRunDetailForManifestCompareAsync(scope, runId, cancellationToken);
        }
        catch (ConflictException ex)
        {
            return MapArtifactExportSealedManifestConflict(ex);
        }

        if (detail?.GoldenManifest is null)
            return null;

        return EnsureSealedManifestHashOrConflict(detail.GoldenManifest, runId.ToString("D"));
    }
}
