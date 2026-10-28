using ArchLucid.Application;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Persistence.ApplicationPorts.Data.Repositories;
using ArchLucid.Application.SecureNow;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Audit;
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
    CollectionRunTriggerService collectionRunTriggerService) : ControllerBase
{
    private readonly CollectionRunTriggerService _collectionRunTriggerService =
        collectionRunTriggerService ?? throw new ArgumentNullException(nameof(collectionRunTriggerService));

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

    [HttpPost("~/v{version:apiVersion}/collection-runs:trigger", Name = "CollectionRunsTrigger")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Audit: CollectionRunTriggerService logs SecureNowCollectionRun.Triggered via IAuditService.")]
    [ProducesResponseType(typeof(CollectionRun), StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> TriggerAsync(
        [FromBody] CollectionRunTriggerRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (!Request.Headers.TryGetValue("Idempotency-Key", out Microsoft.Extensions.Primitives.StringValues idempotencyValues)
            || string.IsNullOrWhiteSpace(idempotencyValues.FirstOrDefault()))
        {
            return this.BadRequestProblem("Idempotency-Key is required.", ProblemTypes.ValidationFailed);
        }

        string idempotencyKey = idempotencyValues.First()!.Trim();

        if (idempotencyKey.Length > 128)
        {
            return this.BadRequestProblem("Idempotency-Key must be at most 128 characters.", ProblemTypes.ValidationFailed);
        }

        IReadOnlyList<string> subscriptionIds = (request?.SubscriptionIds ?? [])
            .Where(static subscriptionId => !string.IsNullOrWhiteSpace(subscriptionId))
            .Select(static subscriptionId => subscriptionId.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (subscriptionIds.Count > 25)
        {
            return this.BadRequestProblem("At most 25 subscriptions may be requested.", ProblemTypes.ValidationFailed);
        }

        try
        {
            ScopeContext scope = scopeContextProvider.GetCurrentScope();
            CollectionRun run = await _collectionRunTriggerService.TriggerAsync(
                scope,
                idempotencyKey,
                subscriptionIds,
                cancellationToken);
            return Accepted(run);
        }
        catch (SecureNowCapacityExceededException)
        {
            Response.Headers.RetryAfter = "5";
            return StatusCode(StatusCodes.Status429TooManyRequests, new { error = "collection_capacity_exceeded" });
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
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
