using ArchLucid.Api.Attributes;
using ArchLucid.Application.Integrations.AzureBoards;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Integrations;

/// <summary>Azure Boards outbound work-item integration (PAT via Key Vault secret names).</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/integrations/azure-boards")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed partial class AzureBoardsIntegrationsController(
    IScopeContextProvider scopeProvider,
    ITenantAzureBoardsOutboundSettingsRepository settingsRepository,
    IAzureBoardsIntegrationService integrationService,
    IAuditService auditService) : ControllerBase
{
    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly ITenantAzureBoardsOutboundSettingsRepository _settingsRepository =
        settingsRepository ?? throw new ArgumentNullException(nameof(settingsRepository));

    private readonly IAzureBoardsIntegrationService _integrationService =
        integrationService ?? throw new ArgumentNullException(nameof(integrationService));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));
}
