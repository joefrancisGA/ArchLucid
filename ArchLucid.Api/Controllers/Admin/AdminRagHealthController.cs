using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Admin;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Operator-visible RAG corpus freshness for the current host process (TB-194).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.PlatformInternalOperationsAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class AdminRagHealthController(IAdminRagHealthQuery adminRagHealthQuery) : ControllerBase
{
    private readonly IAdminRagHealthQuery _adminRagHealthQuery =
        adminRagHealthQuery ?? throw new ArgumentNullException(nameof(adminRagHealthQuery));

    [HttpGet("rag-health")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(AdminRagHealthResponse), StatusCodes.Status200OK)]
    public ActionResult<AdminRagHealthResponse> GetRagHealth()
    {
        return Ok(_adminRagHealthQuery.GetRagHealth());
    }
}
