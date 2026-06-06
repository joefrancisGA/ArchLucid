using ArchLucid.Application.Pilots;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Security;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Deprecated tenant-in-path alias for <see cref="ReferenceEvidenceAdminController" /> (TB-279).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/tenants/{tenantId:guid}/reference-evidence")]
[Obsolete("Use GET /v1/admin/reference-evidence — tenant is resolved from scope only.")]
public sealed class ReferenceEvidenceAdminLegacyController(
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

    [HttpGet]
    [Produces("application/zip")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public Task<IActionResult> GetReferenceEvidenceZipLegacyAsync(
        Guid tenantId,
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
            tenantId,
            cancellationToken);
    }
}
