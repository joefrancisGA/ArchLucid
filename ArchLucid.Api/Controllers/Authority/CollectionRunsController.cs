using ArchLucid.Core.Authorization;
using ArchLucid.Core.Persistence.ApplicationPorts.Data.Repositories;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.SecureNow;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/collection-runs")]
public sealed class CollectionRunsController(
    ICollectionRunRepository collectionRunRepository,
    IScopeContextProvider scopeContextProvider) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<CollectionRun>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAsync(
        [FromQuery] int offset = 0,
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        IReadOnlyList<CollectionRun> runs = await collectionRunRepository.ListAsync(
            scope,
            offset,
            limit,
            cancellationToken);
        return Ok(runs);
    }

    [HttpGet("{runId:guid}")]
    [ProducesResponseType(typeof(CollectionRun), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAsync(
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        CollectionRun? collectionRun = await collectionRunRepository.GetAsync(scope, runId, cancellationToken);

        return collectionRun is null ? NotFound() : Ok(collectionRun);
    }
}
