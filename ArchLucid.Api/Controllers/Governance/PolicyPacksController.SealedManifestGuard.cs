using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class PolicyPacksController
{
    private async Task<IActionResult?> EnsurePolicyPackMutationSealedManifestAllowedAsync(
        CancellationToken cancellationToken)
    {
        ScopeContext? scope = _scopeContextProvider.GetCurrentScope();

        if (scope is null)
            return null;

        return await GovernanceScopePostureSealedManifestPreflight.TryGetConflictResultAsync(
            this,
            scope,
            _runDetailQueryService,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken);
    }

    private async Task<IActionResult?> EnsurePolicyPackSimulateRunSealedManifestAllowedAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(runId, out Guid parsedRunId) || parsedRunId == Guid.Empty)
            return null;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        RunDetailDto? detail =
            await _authorityQueryService.GetRunDetailForManifestCompareAsync(
                scope,
                parsedRunId,
                cancellationToken);

        if (detail is null)
            return null;

        try
        {
            PolicyPackSimulateSealedManifestGuard.EnsureRunSealedManifestHashOrThrow(
                detail.GoldenManifest,
                parsedRunId.ToString("D"),
                _manifestHashService);
        }
        catch (ConflictException ex)
        {
            return MapPolicyPackSealedManifestConflict(ex);
        }

        return null;
    }

    private async Task<IActionResult?> EnsurePolicyPackSimulateBulkRunIdsSealedManifestAllowedAsync(
        IReadOnlyList<string> runIds,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(runIds);

        foreach (string runId in runIds)
        {
            IActionResult? runGuard = await EnsurePolicyPackSimulateRunSealedManifestAllowedAsync(
                runId,
                cancellationToken);

            if (runGuard is not null)
                return runGuard;
        }

        return null;
    }

    /// <summary>
    ///     Maps policy pack mutation/simulate <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapPolicyPackSealedManifestConflict(ConflictException ex) =>
        PolicyPackSealedManifestConflictMapping.MapPolicyPackSealedManifestConflict(this, ex);

}
