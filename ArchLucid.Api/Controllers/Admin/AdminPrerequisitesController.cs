using ArchLucid.Api.Attributes;
using ArchLucid.Application.AzureExtractor;
using ArchLucid.Application.AwsExtractor;
using ArchLucid.Application.GcpExtractor;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.AwsExtractor;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Admin prerequisites readiness probes (bundled to reduce page-load fan-out).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/prerequisites")]
[EnableRateLimiting("fixed")]
public sealed class AdminPrerequisitesController(
    IScopeContextProvider scopeProvider,
    ITier2ConnectionService azureTier2ConnectionService,
    IAwsTier2ConnectionService awsTier2ConnectionService,
    IGcpTier2ConnectionService gcpTier2ConnectionService) : ControllerBase
{
    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly ITier2ConnectionService _azureTier2ConnectionService =
        azureTier2ConnectionService ?? throw new ArgumentNullException(nameof(azureTier2ConnectionService));

    private readonly IAwsTier2ConnectionService _awsTier2ConnectionService =
        awsTier2ConnectionService ?? throw new ArgumentNullException(nameof(awsTier2ConnectionService));

    private readonly IGcpTier2ConnectionService _gcpTier2ConnectionService =
        gcpTier2ConnectionService ?? throw new ArgumentNullException(nameof(gcpTier2ConnectionService));

    /// <summary>Whether Azure, AWS, or GCP Tier 2 connections exist for the tenant.</summary>
    [HttpGet("cloud-connections-summary")]
    [ProducesResponseType(typeof(AdminPrerequisitesCloudConnectionsSummaryResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCloudConnectionsSummary(CancellationToken cancellationToken)
    {
        Guid tenantId = _scopeProvider.GetCurrentScope().TenantId;

        Task<IReadOnlyList<Tier2ConnectionSummary>> azureTask =
            _azureTier2ConnectionService.ListConnectionsAsync(tenantId, cancellationToken);

        Task<IReadOnlyList<AwsTier2ConnectionSummary>> awsTask =
            _awsTier2ConnectionService.ListConnectionsAsync(tenantId, cancellationToken);

        Task<IReadOnlyList<GcpTier2ConnectionSummary>> gcpTask =
            _gcpTier2ConnectionService.ListConnectionsAsync(tenantId, cancellationToken);

        await Task.WhenAll(azureTask, awsTask, gcpTask).ConfigureAwait(false);

        bool anyConfigured =
            (await azureTask.ConfigureAwait(false)).Count > 0
            || (await awsTask.ConfigureAwait(false)).Count > 0
            || (await gcpTask.ConfigureAwait(false)).Count > 0;

        AdminPrerequisitesCloudConnectionsSummaryResponse body = new() { AnyConfigured = anyConfigured };

        return Ok(body);
    }
}
