using ArchLucid.Api.Attributes;
using ArchLucid.Application.Operator;
using ArchLucid.Contracts.User;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.User;

/// <summary>Single server-side rollup for assigned findings, approvals, and alerts counts.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AuthenticatedUserOnly)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/user/attention-summary")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class UserAttentionSummaryController(
    IOperatorShellStatusService operatorShellStatusService,
    TimeProvider timeProvider) : ControllerBase
{
    private readonly IOperatorShellStatusService _operatorShellStatusService =
        operatorShellStatusService ?? throw new ArgumentNullException(nameof(operatorShellStatusService));

    private readonly TimeProvider _timeProvider = timeProvider ?? TimeProvider.System;

    [HttpGet]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(UserAttentionSummaryResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAttentionSummaryAsync(CancellationToken cancellationToken)
    {
        OperatorShellStatusResult shellStatus = await _operatorShellStatusService
            .BuildAsync(includeLlmMonthlyBudgetStatus: false, includeAlertsInboxSummary: true, cancellationToken)
            .ConfigureAwait(false);

        int awaitingApprovalCount = shellStatus.ReviewsAwaitingAction?.Items?.Count ?? 0;
        int alertsOpenCount = shellStatus.AlertsInboxSummary?.OpenCount ?? 0;

        return Ok(new UserAttentionSummaryResponse
        {
            AssignedToMeFindingsCount = shellStatus.AssignedToMeFindingsCount ?? 0,
            AwaitingApprovalCount = awaitingApprovalCount,
            AlertsOpenCount = alertsOpenCount,
            CheckedAtUtc = _timeProvider.GetUtcNow(),
        });
    }
}
