using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class AnalysisReportsController
{
    private async Task<IActionResult?> EnsureRunAnalysisSealedManifestAllowedAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        try
        {
            await ArchitectureAnalysisSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
                runId,
                scope,
                _authorityQueryService,
                _manifestHashService,
                cancellationToken);
        }
        catch (ConflictException ex)
        {
            return MapAnalysisReportExportSealedManifestConflict(ex);
        }

        return null;
    }

    /// <summary>
    ///     Maps analysis report export <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapAnalysisReportExportSealedManifestConflict(ConflictException ex)
    {
        string problemType = ex.Message.Contains("hash verification failed", StringComparison.OrdinalIgnoreCase)
            ? ProblemTypes.DecisionReceiptSealedHashMismatch
            : ex.Message.Contains("fields are incomplete", StringComparison.OrdinalIgnoreCase)
                ? ProblemTypes.DecisionReceiptSealedIncomplete
                : ProblemTypes.Conflict;

        return this.ConflictProblem(ex.Message, problemType);
    }
}
