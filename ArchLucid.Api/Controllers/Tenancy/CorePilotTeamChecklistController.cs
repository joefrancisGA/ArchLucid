using ArchLucid.Api.Attributes;
using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Tenancy;

[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/tenant/core-pilot-checklist")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class CorePilotTeamChecklistController(
    ICorePilotTeamChecklistRepository repository,
    IScopeContextProvider scopeProvider,
    IActorContext actorContext) : ControllerBase
{
    private readonly ICorePilotTeamChecklistRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    [HttpGet]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(IReadOnlyList<CorePilotChecklistStepResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        IReadOnlyList<CorePilotChecklistStepRow> rows = await _repository
            .ListAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, cancellationToken)
            .ConfigureAwait(false);

        CorePilotChecklistStepResponse[] body = rows
            .Select(static r => new CorePilotChecklistStepResponse
            {
                StepIndex = r.StepIndex,
                IsCompleted = r.IsCompleted,
                UpdatedUtc = r.UpdatedUtc,
                UpdatedByUserId = r.UpdatedByUserId
            })
            .ToArray();

        return Ok(body);
    }

    [HttpPut]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PutAsync(
        [FromBody] CorePilotChecklistPutRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (body.StepIndex is < 0 or > 3)
            return this.BadRequestProblem("stepIndex must be between 0 and 3.", ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeProvider.GetCurrentScope();
        string actor = _actorContext.GetActorId();

        await _repository
            .UpsertAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                body.StepIndex,
                body.IsCompleted,
                actor,
                cancellationToken)
            .ConfigureAwait(false);

        return NoContent();
    }
}
