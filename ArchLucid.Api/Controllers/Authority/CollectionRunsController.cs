using ArchLucid.Core.Authorization;
using ArchLucid.Core.Audit;
using ArchLucid.Application.Common;
using ArchLucid.Application.SecureNow;
using ArchLucid.Api.ProblemDetails;
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
    IScopeContextProvider scopeContextProvider,
    ICollectionRunTrigger collectionRunTrigger,
    IActorContext actorContext) : ControllerBase
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

    [HttpPost(":trigger")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("AutomationCollectionRunTrigger emits SecureNow.CollectionRunTriggered after the Automation runbook is accepted.")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> TriggerAsync(CancellationToken cancellationToken = default)
    {
        CollectionRunTriggerResult result = await collectionRunTrigger.TriggerAsync(
            actorContext.GetActorId(),
            cancellationToken);

        if (!result.Succeeded)
            return this.UnprocessableEntityProblem(result.FailureDetail ?? "The collection run could not be started.");

        return Accepted(new
        {
            runId = result.RunId,
            alreadyPending = result.AlreadyPending,
        });
    }
}
