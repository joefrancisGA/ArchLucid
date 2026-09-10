using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.InfraEvidence;

public sealed partial class ArchitectureDiagramReconciliationController
{
    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private async Task<IActionResult?> EnsureRunSealedManifestAllowedAsync(
        Guid runId,
        CancellationToken cancellationToken)
    {
        if (runId == Guid.Empty)
            return null;

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        try
        {
            await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
                runId,
                scope,
                _authorityQueryService,
                _manifestHashService,
                cancellationToken);
        }
        catch (ConflictException ex)
        {
            return MapDiagramReconcileSealedManifestConflict(ex);

        }

        return null;
    }

    /// <summary>
    ///     Maps diagram reconcile <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapDiagramReconcileSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
}
