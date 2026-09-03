using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http;
using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using FluentValidation;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Governance;

/// <summary>
///     Versioned policy pack CRUD, publish, assign, and effective-governance reads for the ambient
///     tenant/workspace/project.
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/policy-packs")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public sealed partial class PolicyPacksController(
    IPolicyPackHttpFacade httpFacade,
    IValidator<CreatePolicyPackRequest> createPolicyPackRequestValidator,
    IValidator<PublishPolicyPackVersionRequest> publishPolicyPackVersionRequestValidator,
    IValidator<AssignPolicyPackRequest> assignPolicyPackRequestValidator)
    : ControllerBase
{
    private readonly IPolicyPackHttpFacade _httpFacade =
        httpFacade ?? throw new ArgumentNullException(nameof(httpFacade));

    private readonly IValidator<CreatePolicyPackRequest> _createPolicyPackRequestValidator =
        createPolicyPackRequestValidator ?? throw new ArgumentNullException(nameof(createPolicyPackRequestValidator));

    private readonly IValidator<PublishPolicyPackVersionRequest> _publishPolicyPackVersionRequestValidator =
        publishPolicyPackVersionRequestValidator
        ?? throw new ArgumentNullException(nameof(publishPolicyPackVersionRequestValidator));

    private readonly IValidator<AssignPolicyPackRequest> _assignPolicyPackRequestValidator =
        assignPolicyPackRequestValidator ?? throw new ArgumentNullException(nameof(assignPolicyPackRequestValidator));

    private IActionResult? BadRequestWhenRouteIdEmpty(Guid id, string parameterName) =>
        PolicyPacksHttpMapper.ValidateRouteId(id, parameterName).ToBadRequestProblemOrNull(this);
}
