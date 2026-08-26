using ArchLucid.Api.Formatters;
using ArchLucid.Application.Reporting;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>
///     Returns a pageable audit event log for the caller's tenant/workspace/project scope.
/// </summary>
/// <remarks>
///     Events are appended by all mutating operations across the ArchLucid API (run creation, governance promotion, alert
///     delivery, etc.).
///     Results are ordered newest-first and capped by the <c>take</c> parameter (max
///     <see cref="PaginationDefaults.MaxListingTake" />).
/// </remarks>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/audit")]
[EnableRateLimiting("fixed")]
public sealed partial class AuditController(
    IAuditRepository repo,
    IScopeContextProvider scopeProvider,
    ExportFormatterService exportFormatter) : ControllerBase
{
}
