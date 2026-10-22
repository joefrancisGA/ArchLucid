using ArchLucid.Api.Models.Integrations;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Integrations.AzureBoards;
using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Integrations;

public sealed partial class AzureBoardsIntegrationsController
{
    [HttpGet("health")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(AzureBoardsIntegrationHealthResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHealthAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        AzureBoardsStoredHealth stored =
            await _integrationService.GetStoredHealthAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        return Ok(new AzureBoardsIntegrationHealthResponse
        {
            Status = stored.Status,
            Reachable = stored.Reachable,
            Summary = stored.Summary,
            StatusCode = stored.StatusCode
        });
    }

    [HttpGet("projects")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(AzureBoardsNamedItemsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListProjectsAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        IReadOnlyList<string> projects =
            await _integrationService.ListProjectsAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        return Ok(new AzureBoardsNamedItemsResponse { Items = projects });
    }

    [HttpGet("projects/{project}/work-item-types")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(AzureBoardsNamedItemsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ListWorkItemTypesAsync(string project, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(project))
            return this.BadRequestProblem("project is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        IReadOnlyList<string> workItemTypes =
            await _integrationService.ListWorkItemTypesAsync(scope.TenantId, project, cancellationToken)
                .ConfigureAwait(false);

        return Ok(new AzureBoardsNamedItemsResponse { Items = workItemTypes });
    }
}
