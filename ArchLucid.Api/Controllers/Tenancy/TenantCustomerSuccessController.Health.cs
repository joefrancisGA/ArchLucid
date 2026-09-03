using ArchLucid.Api.Http;
using ArchLucid.Api.Models.CustomerSuccess;
using ArchLucid.Application.CustomerSuccess;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Tenancy;

public sealed partial class TenantCustomerSuccessController
{
    /// <summary>Returns the latest materialized health score row when the worker has populated it.</summary>
    [HttpGet("health-score")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(TenantHealthScoreResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetHealthScoreAsync(CancellationToken cancellationToken)
    {
        (IActionResult? scopeProblem, ScopeContext scope) = await TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            this,
            _scopeProvider,
            _tenantRepository,
            cancellationToken).ConfigureAwait(false);

        if (scopeProblem is not null)
            return scopeProblem;

        TenantHealthScoreRecord? row = await _customerSuccessRepository.GetHealthScoreAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                cancellationToken)
            .ConfigureAwait(false);

        if (row is null)
        {
            return Ok(
                new TenantHealthScoreResponse { IsCalculated = false });
        }

        return Ok(
            new TenantHealthScoreResponse
            {
                IsCalculated = true,
                EngagementScore = row.EngagementScore,
                BreadthScore = row.BreadthScore,
                QualityScore = row.QualityScore,
                GovernanceScore = row.GovernanceScore,
                SupportScore = row.SupportScore,
                CompositeScore = row.CompositeScore,
                UpdatedUtc = row.UpdatedUtc
            });
    }

    /// <summary>Top next actions for the active scope (sticky operator home guidance).</summary>
    [HttpGet("next-actions")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(IReadOnlyList<OperatorNextBestActionResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNextBestActionsAsync(CancellationToken cancellationToken)
    {
        (IActionResult? scopeProblem, ScopeContext scope) = await TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync(
            this,
            _scopeProvider,
            _tenantRepository,
            cancellationToken).ConfigureAwait(false);

        if (scopeProblem is not null)
            return scopeProblem;

        IReadOnlyList<OperatorNextBestActionItem> items =
            await _nextBestActionService.GetActionsAsync(cancellationToken).ConfigureAwait(false);

        OperatorNextBestActionResponse[] body = items
            .Select(static i => new OperatorNextBestActionResponse
            {
                ActionId = i.ActionId,
                Title = i.Title,
                Reason = i.Reason,
                Href = i.Href
            })
            .ToArray();

        return Ok(body);
    }
}
