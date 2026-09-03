using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Tenancy;

/// <summary>Lists workspaces and architecture projects for the authenticated tenant scope.</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/tenant/workspaces")]
public sealed partial class TenantWorkspacesController(
    ITenantRepository tenantRepository,
    IArchitectureProjectRepository architectureProjectRepository,
    IScopeContextProvider scopeProvider,
    IAuditService auditService,
    IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions> retentionPurgeOptions) : ControllerBase
{
    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly IArchitectureProjectRepository _architectureProjectRepository =
        architectureProjectRepository ?? throw new ArgumentNullException(nameof(architectureProjectRepository));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IOptionsMonitor<ArchitectureProjectRetentionPurgeOptions> _retentionPurgeOptions =
        retentionPurgeOptions ?? throw new ArgumentNullException(nameof(retentionPurgeOptions));
}
