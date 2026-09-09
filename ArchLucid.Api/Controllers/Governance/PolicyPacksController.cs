using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http;
using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.Validators;
using ArchLucid.Application;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

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
    IValidator<AssignPolicyPackRequest> assignPolicyPackRequestValidator,
    IScopeContextProvider scopeContextProvider,
    IRunDetailQueryService runDetailQueryService,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService)
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

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private IActionResult? BadRequestWhenRouteIdEmpty(Guid id, string parameterName) =>
        PolicyPacksHttpMapper.ValidateRouteId(id, parameterName).ToBadRequestProblemOrNull(this);
}
