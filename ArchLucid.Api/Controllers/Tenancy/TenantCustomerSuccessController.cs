using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http;
using ArchLucid.Application.CustomerSuccess;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Interfaces;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Tenancy;

/// <summary>Customer health scores and PMF feedback for the active tenant scope.</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/tenant/customer-success")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed partial class TenantCustomerSuccessController(
    ITenantCustomerSuccessRepository customerSuccessRepository,
    IOperatorNextBestActionService nextBestActionService,
    IOperatorStickinessSnapshotReader stickinessSnapshotReader,
    IScopeContextProvider scopeProvider,
    IRunRepository runRepository,
    ITenantRepository tenantRepository,
    IFindingInspectReadRepository findingInspectReadRepository) : ControllerBase
{
    private readonly ITenantCustomerSuccessRepository _customerSuccessRepository =
        customerSuccessRepository ?? throw new ArgumentNullException(nameof(customerSuccessRepository));

    private readonly IOperatorNextBestActionService _nextBestActionService =
        nextBestActionService ?? throw new ArgumentNullException(nameof(nextBestActionService));

    private readonly IOperatorStickinessSnapshotReader _stickinessSnapshotReader =
        stickinessSnapshotReader ?? throw new ArgumentNullException(nameof(stickinessSnapshotReader));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly IFindingInspectReadRepository _findingInspectReadRepository =
        findingInspectReadRepository ?? throw new ArgumentNullException(nameof(findingInspectReadRepository));
}
