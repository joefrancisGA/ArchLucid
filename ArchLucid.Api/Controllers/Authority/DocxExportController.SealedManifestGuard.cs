using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class DocxExportController
{
    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private async Task<IActionResult?> EnsureArchitecturePackageDocxSealedManifestAllowedAsync(
        Guid runId,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        try
        {
            await ConsultingDocxExportSealedReceiptGuard.EnsureVerifiedOrThrowAsync(
                runId,
                runId.ToString("N"),
                _authorityQueryService,
                _manifestHashService,
                scope,
                cancellationToken);
        }
        catch (ConflictException ex)
        {
            return MapDocxExportSealedManifestConflict(ex);
        }

        return null;
    }

    /// <summary>
    ///     Maps DOCX export <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapDocxExportSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);

    private async Task<IActionResult?> EnsureCompareRunDocxSealedManifestAllowedAsync(
        Guid compareRunId,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        try
        {
            await RunExportSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
                compareRunId.ToString("N"),
                scope,
                _authorityQueryService,
                _manifestHashService,
                cancellationToken);
        }
        catch (ConflictException ex)
        {
            return MapDocxExportSealedManifestConflict(ex);
        }

        return null;
    }
}
