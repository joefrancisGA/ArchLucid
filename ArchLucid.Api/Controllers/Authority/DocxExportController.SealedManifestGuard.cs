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
    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

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
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }

        return null;
    }

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
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }

        return null;
    }
}
