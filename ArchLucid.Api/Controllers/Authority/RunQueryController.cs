using ArchLucid.Api.Http;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Services.Authority;
using ArchLucid.Application.Runs.Query;
using ArchLucid.Application.Traceability;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
///     Read-only HTTP API for architecture runs: detail, provenance, decisions, evidence, traces, and list.
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status429TooManyRequests)]
public sealed partial class RunQueryController(
    IRunGraphQueryService runGraphQueryService,
    IRunFindingsQueryService runFindingsQueryService,
    IRunProvenanceQueryService runProvenanceQueryService,
    ITraceabilityBundleExportApplicationService traceabilityBundleExport) : ControllerBase
{
}
