using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.InfraEvidence;

public sealed partial class CloudResourceEvidenceHubController
{
    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private async Task<IActionResult?> EnsureHubRunSealedManifestAllowedAsync(
        Guid? runId,
        CancellationToken cancellationToken)
    {
        if (runId is not { } resolvedRunId || resolvedRunId == Guid.Empty)
            return null;

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        try
        {
            await CloudResourceEvidenceHubSealedManifestHashGuard.EnsureRunSealedOrThrowAsync(
                resolvedRunId,
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
