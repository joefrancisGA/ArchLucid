using ArchLucid.Application.Common;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Integrations;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Integrations;

/// <summary>Operator-registered ITSM ticket ↔ finding correlation for inbound webhooks.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/integrations/itsm/correlations")]
[EnableRateLimiting("fixed")]
public sealed partial class ItsmCorrelationController(
    IScopeContextProvider scope,
    IActorContext actorContext,
    IItsmFindingCorrelationRepository correlations,
    ItsmFindingCorrelationQueryService correlationQuery,
    IAuditService auditService) : ControllerBase
{
    private readonly IScopeContextProvider _scope = scope ?? throw new ArgumentNullException(nameof(scope));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IItsmFindingCorrelationRepository _correlations =
        correlations ?? throw new ArgumentNullException(nameof(correlations));

    private readonly ItsmFindingCorrelationQueryService _correlationQuery =
        correlationQuery ?? throw new ArgumentNullException(nameof(correlationQuery));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private const int MaxBatchFindingIds = 100;
}
