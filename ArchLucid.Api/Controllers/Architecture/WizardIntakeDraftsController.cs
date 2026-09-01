using ArchLucid.Api.Http;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Intake;
using ArchLucid.Contracts.Intake;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Architecture;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.AuthenticatedUserOnly)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture/intake/wizard-draft")]
public sealed class WizardIntakeDraftsController(
    IScopeContextProvider scopeProvider,
    ITenantRepository tenantRepository,
    IWizardIntakeDraftService wizardIntakeDraftService) : ControllerBase
    [HttpGet("{wizardId}")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(WizardIntakeDraftResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDraft(string wizardId, CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        WizardIntakeDraftResponse? draft =
            await wizardIntakeDraftService.GetAsync(scope, wizardId, cancellationToken);

        if (draft is null)
            return NotFound();

        return Ok(draft);
    }

    [HttpPut("{wizardId}")]
    [MutatingAuditExcluded("Wizard intake draft upsert is debounced operator convenience state, not authority mutation.")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(WizardIntakeDraftResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpsertDraft(
        string wizardId,
        [FromBody] UpsertWizardIntakeDraftRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = scopeProvider.GetCurrentScope();
        WizardIntakeDraftResponse draft =
            await wizardIntakeDraftService.UpsertAsync(scope, wizardId, body, cancellationToken);

        return Ok(draft);
    }
}
