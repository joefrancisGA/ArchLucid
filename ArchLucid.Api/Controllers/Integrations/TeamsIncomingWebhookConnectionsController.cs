using ArchLucid.Application.Integrations;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Integrations;

using ArchLucid.Api.Attributes;
using ArchLucid.Core.Authorization;

/// <summary>Per-tenant Microsoft Teams notification connector configuration (Key Vault secret name only).</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/integrations/teams")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed partial class TeamsIncomingWebhookConnectionsController(
    IScopeContextProvider scopeProvider,
    ITenantTeamsIncomingWebhookConnectionRepository connectionRepository,
    IAuditService auditService,
    ITeamsIncomingWebhookConnectionProbeService probeService) : ControllerBase;
