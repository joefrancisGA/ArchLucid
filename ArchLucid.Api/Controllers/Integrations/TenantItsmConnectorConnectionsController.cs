using ArchLucid.Api.Attributes;
using ArchLucid.Application.Integrations.Itsm.OAuth;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Integrations;

/// <summary>Per-tenant Jira / ServiceNow connector credential references (Key Vault secret names only — TB-392).</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/integrations/itsm/connections")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed partial class TenantItsmConnectorConnectionsController(
    IScopeContextProvider scopeProvider,
    ITenantItsmConnectorConnectionRepository connectionRepository,
    IItsmAtlassianOAuthConsentService atlassianOAuthConsentService,
    IAuditService auditService) : ControllerBase
{
    private readonly IItsmAtlassianOAuthConsentService _atlassianOAuthConsentService =
        atlassianOAuthConsentService ?? throw new ArgumentNullException(nameof(atlassianOAuthConsentService));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ITenantItsmConnectorConnectionRepository _connectionRepository =
        connectionRepository ?? throw new ArgumentNullException(nameof(connectionRepository));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));
}
