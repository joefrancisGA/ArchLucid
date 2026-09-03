using ArchLucid.Api.Attributes;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Planning;

/// <summary>
///     HTTP API for retrieving the evidence graph snapshot associated with an architecture review.
/// </summary>
/// <remarks>
///     Canonical routes under <c>v1/evidence-graph</c> (ADR 0064 alias <c>/v1/graph</c> removed).
/// </remarks>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/evidence-graph")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed partial class GraphController(
    IAuthorityQueryService authorityQueryService,
    IRunRepository runRepository,
    IScopeContextProvider scopeProvider,
    IOptions<KnowledgeGraphLimitsOptions> knowledgeGraphLimits)
    : ControllerBase;
