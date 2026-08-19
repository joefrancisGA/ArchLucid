using ArchLucid.Application.Pilots;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Security;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Admin-only export of reference-evidence ZIP bundles for the ambient tenant scope (TB-279).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/reference-evidence")]
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
    /// <param name="includeDemo">When <see langword="true" />, allow Contoso demo seed runs as the anchor.</param>
    [HttpGet]
    [Produces("application/zip")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public Task<IActionResult> GetReferenceEvidenceZipAsync(
        [FromQuery] bool includeDemo = false,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        string baseForLinks = TrustedApiLinkBaseResolver.Resolve(_configuration, Request.Scheme, Request.Host.Value);

        return ReferenceEvidenceAdminZipResultFactory.BuildZipAsync(
            this,
            _exportService,
            scope,
            baseForLinks,
            includeDemo,
            scope.TenantId,
            cancellationToken);
    }
}
