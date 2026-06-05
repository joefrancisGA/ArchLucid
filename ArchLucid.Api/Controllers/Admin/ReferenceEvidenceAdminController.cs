using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Pilots;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Security;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Admin-only export of reference-evidence ZIP bundles per tenant.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/tenants/{tenantId:guid}/reference-evidence")]
public sealed class ReferenceEvidenceAdminController(
    IReferenceEvidenceAdminExportService exportService,
    IScopeContextProvider scopeContextProvider,
    IConfiguration configuration) : ControllerBase
{
    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly IReferenceEvidenceAdminExportService _exportService =
        exportService ?? throw new ArgumentNullException(nameof(exportService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    /// <summary>
    ///     ZIP containing <c>pilot-run-deltas.json</c>, first-value Markdown/PDF, optional sponsor one-pager, and a README.
    /// </summary>
    /// <param name="tenantId">Tenant whose latest committed (non-demo by default) run anchors the bundle.</param>
    /// <param name="includeDemo">When <see langword="true" />, allow Contoso demo seed runs as the anchor.</param>
    [HttpGet]
    [Produces("application/zip")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetReferenceEvidenceZipAsync(
        Guid tenantId,
        [FromQuery] bool includeDemo = false,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        string baseForLinks = TrustedApiLinkBaseResolver.Resolve(_configuration, Request.Scheme, Request.Host.Value);
        byte[]? zip = await _exportService.BuildZipAsync(scope.TenantId, includeDemo, baseForLinks, cancellationToken);

        if (zip is null || zip.Length == 0)
        {
            return this.NotFoundProblem(
                "No reference evidence ZIP could be built for this tenant (no qualifying committed run, or export produced no content).",
                ProblemTypes.ResourceNotFound);
        }

        return File(zip, "application/zip", $"reference-evidence-{tenantId:D}.zip");
    }
}
