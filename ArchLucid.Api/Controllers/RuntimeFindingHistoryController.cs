using ArchLucid.Api.Security;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Controllers;

/// <summary>Historical evidence only. This endpoint never changes sealed findings.</summary>
[ApiController]
[Authorize]
[Route("api/securenow/runtime-finding-history")]
public sealed class RuntimeFindingHistoryController : ControllerBase
{
    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetAsync([FromQuery] Guid tenantId, [FromQuery] Guid workspaceId,
        [FromQuery] Guid projectId, [FromQuery] string resourceId, [FromQuery] string deploymentGeneration,
        [FromQuery] string runtimeFamily, [FromQuery] int limit = 10, CancellationToken ct = default)
    {
        if (tenantId == Guid.Empty || workspaceId == Guid.Empty || projectId == Guid.Empty ||
            string.IsNullOrWhiteSpace(resourceId) || resourceId.Length > 2048 ||
            string.IsNullOrWhiteSpace(deploymentGeneration) || deploymentGeneration.Length > 256 ||
            string.IsNullOrWhiteSpace(runtimeFamily) || runtimeFamily.Length > 128 || limit is < 1 or > 20)
            return BadRequest();
        if (User.Identity?.IsAuthenticated != true) return Unauthorized();
        var reader = HttpContext.RequestServices.GetRequiredService<SqlRuntimeFindingJournalReader>();
        var request = new RuntimeObservationRequest(tenantId, workspaceId, projectId, resourceId,
            deploymentGeneration, runtimeFamily);
        var rows = await reader.ReadAsync(request, limit, ct);
        // Do not distinguish an unauthorized scope from missing or invalid backing evidence.
        if (rows is null) return NotFound();
        return Ok(new { historical = true, currentStatusEstablished = false, entries = rows });
    }
}
