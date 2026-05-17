using System.Security.Claims;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Jobs;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

using ArchLucid.Host.Core.Jobs;

/// <summary>Platform-scoped tenant lifecycle (offboarding).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.PlatformTenantDeletionAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/tenants")]
public sealed class AdminTenantsController(ITenantRepository tenantRepository, IBackgroundJobQueue backgroundJobQueue)
    : ControllerBase
{
    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly IBackgroundJobQueue _backgroundJobQueue =
        backgroundJobQueue ?? throw new ArgumentNullException(nameof(backgroundJobQueue));

    /// <summary>Queues durable deletion of all tenant-scoped SQL rows, tenant blob prefixes, and emits <c>TenantDataDeleted</c> platform audit.</summary>
    [HttpPost("{id:guid}/delete")]
    [EnableRateLimiting("expensive")]
    [ProducesResponseType(typeof(TenantDeletionQueuedResponse), StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> QueueTenantDeletionAsync(Guid id, CancellationToken cancellationToken = default)
    {
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(id, cancellationToken);

        if (tenant is null)
            return this.NotFoundProblem($"Tenant '{id:D}' was not found.", ProblemTypes.ResourceNotFound);

        ClaimsPrincipal user = User;
        string userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unknown";
        string userName = user.Identity?.Name ?? "unknown";
        string? correlation = HttpContext.TraceIdentifier;
        TenantDeletionWorkUnit work = new(new TenantDeletionJobPayload(id, userId, userName, correlation));
        string jobId = await _backgroundJobQueue.EnqueueAsync(work, cancellationToken: cancellationToken);

        return Accepted(new TenantDeletionQueuedResponse(jobId));
    }
}

public sealed record TenantDeletionQueuedResponse(string JobId);
