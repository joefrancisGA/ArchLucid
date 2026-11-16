using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration.Summary;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Tenancy;

[ApiController]
[ApiVersion("1.0")]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[Route("v{version:apiVersion}/admin/settings")]
[Tags("Settings")]
public sealed class WorkOwnershipDeletePolicyController(
    ITenantWorkOwnershipDeletePolicyService workOwnershipDeletePolicyService) : ControllerBase
{
    /// <summary>Whether creators may delete or archive their own unsealed architectures and in-flight reviews.</summary>
    [HttpGet("work-ownership-delete-policy")]
    [ProducesResponseType(typeof(TenantWorkOwnershipDeletePolicyResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TenantWorkOwnershipDeletePolicyResponse>> GetWorkOwnershipDeletePolicy(
        CancellationToken cancellationToken)
    {
        bool allowCreatorDelete = await workOwnershipDeletePolicyService
            .GetAllowCreatorDeleteOwnedWorkAsync(cancellationToken)
            .ConfigureAwait(false);

        return Ok(new TenantWorkOwnershipDeletePolicyResponse { AllowCreatorDeleteOwnedWork = allowCreatorDelete });
    }
}
