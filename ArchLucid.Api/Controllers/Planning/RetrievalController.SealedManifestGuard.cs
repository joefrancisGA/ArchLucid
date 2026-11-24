using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Support;
using ArchLucid.Application;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Pagination;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Planning;

public sealed partial class RetrievalController
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private readonly IArchitectureShareAccessGate _architectureShareAccessGate =
        architectureShareAccessGate ?? throw new ArgumentNullException(nameof(architectureShareAccessGate));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    // Limit enumeration, rather than silently broaden or truncate a project search.
    private const int MaxAuthorizationPages = 5;

    private async Task<(Guid? RunId, HashSet<Guid> Allowed, IActionResult? Rejection)> ResolveAuthorizedRetrievalRunsAsync(
        ScopeContext scope, Guid? runId, Guid? manifestId, CancellationToken ct)
    {
        HashSet<Guid> allowed = [];
        if (manifestId is Guid exactId)
        {
            IActionResult MissingManifest() => this.NotFoundProblem(
                $"Manifest '{exactId}' was not found.", ProblemTypes.ManifestNotFound);

            if (exactId == Guid.Empty)
                return (null, allowed, MissingManifest());

            Guid? owner = await _authorityQueryService.GetRunIdByManifestIdAsync(scope, exactId, ct);
            if (owner is not Guid ownerId || ownerId == Guid.Empty ||
                (runId.HasValue && runId.Value != ownerId))
                return (null, allowed, MissingManifest());

            IActionResult? denial = await _architectureShareAccessGate.EnsureRunReadAllowedAsync(
                this, User, scope, ownerId, ct);
            if (denial is not null)
                return (null, allowed, MissingManifest());

            allowed.Add(ownerId);
            return (ownerId, allowed, null);
        }

        if (runId is Guid requestedRunId)
        {
            if (requestedRunId == Guid.Empty)
                return (null, allowed, this.NotFoundProblem(
                    $"Run '{requestedRunId}' was not found.", ProblemTypes.RunNotFound));

            IActionResult? denial = await _architectureShareAccessGate.EnsureRunReadAllowedAsync(
                this, User, scope, requestedRunId, ct);
            if (denial is not null)
                return (null, allowed, denial);

            allowed.Add(requestedRunId);
            return (requestedRunId, allowed, null);
        }

        DateTime? cursorCreatedUtc = null;
        Guid? cursorRunId = null;
        HashSet<Guid> visited = [];
        for (int pageNumber = 0; pageNumber < MaxAuthorizationPages; pageNumber++)
        {
            RunListPage page = await _runRepository.ListRecentInScopeKeysetAsync(
                scope, cursorCreatedUtc, cursorRunId, RunPagination.MaxTake, ct);

            foreach (RunRecord candidate in page.Items)
            {
                if (candidate.RunId == Guid.Empty || !visited.Add(candidate.RunId))
                    continue;

                // The list is discovery only; always resolve actual sharing through the canonical gate.
                IActionResult? denial = await _architectureShareAccessGate.EnsureRunReadAllowedAsync(
                    this, User, scope, candidate.RunId, ct);
                if (denial is null)
                    allowed.Add(candidate.RunId);
            }

            if (!page.HasMore)
                return (null, allowed, null);

            if (page.Items.Count == 0)
                break;

            RunRecord last = page.Items[^1];
            if (last.RunId == Guid.Empty ||
                (cursorCreatedUtc == last.CreatedUtc && cursorRunId == last.RunId))
                break;

            cursorCreatedUtc = last.CreatedUtc;
            cursorRunId = last.RunId;
        }

        return (null, [], this.ConflictProblem(
            "Project-wide retrieval cannot verify every run within the authorization budget. Specify a run or manifest.",
            ProblemTypes.Conflict));
    }

    private async Task<IActionResult?> EnsureExactRetrievalManifestSealedReadAsync(
        ScopeContext scope, Guid runId, Guid manifestId, CancellationToken ct)
    {
        ManifestSummaryDto? summary = await _authorityQueryService.GetManifestSummaryAsync(scope, manifestId, ct);
        if (summary is null || summary.ManifestId != manifestId || summary.RunId != runId)
            return this.NotFoundProblem($"Manifest '{manifestId}' was not found.", ProblemTypes.ManifestNotFound);

        RunDetailDto? detail = await _authorityQueryService.GetRunDetailForManifestCompareAsync(scope, runId, ct);
        var exactManifest = detail?.GoldenManifest?.ManifestId == manifestId
            ? detail.GoldenManifest
            : await _authorityQueryService.GetManifestForSummaryVerificationAsync(scope, manifestId, ct);

        SealedManifestReadGuard.EnsureManifestSummaryBindingAndHashesOrThrow(
            scope, manifestId, summary, exactManifest, detail, _manifestHashService);

        return null;
    }

    private async Task<IActionResult?> EnsureRunScopedRetrievalSealedManifestReadAllowedAsync(
        Guid? runId,
        CancellationToken cancellationToken)
    {
        if (runId is null || runId == Guid.Empty)
            return null;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunDetailDto? detail = await _authorityQueryService.GetRunDetailAsync(scope, runId.Value, cancellationToken);

        if (detail?.GoldenManifest is null)
            return null;

        try
        {
            SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(
                detail.GoldenManifest,
                runId.Value.ToString("D"),
                _manifestHashService);
        }
        catch (ConflictException ex)
        {
            return MapRetrievalSealedManifestConflict(ex);
        }

        return null;
    }

    /// <summary>
    ///     Maps run-scoped retrieval read <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapRetrievalSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
}
