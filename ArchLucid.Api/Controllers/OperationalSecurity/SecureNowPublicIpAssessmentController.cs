using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.InfraEvidence;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.ProductLine;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.OperationalSecurity;

[ApiController]
[ApiExplorerSettings(IgnoreApi = true)] // Opt-in preview. Do not advertise the route in the published contract.
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/securenow/free/public-ip-assessment")]
[EnableRateLimiting("fixed")]
public sealed class SecureNowPublicIpAssessmentController(
    IPublicIpAssessmentQueryService assessment,
    IScopeContextProvider scopeProvider,
    IProductLineRequestAccessor productLine,
    IOptionsSnapshot<SecureNowFreePublicIpAssessmentOptions> options) : ControllerBase
{
    private const string NotFoundDetail = "The public IP assessment was not found.";

    [HttpGet("{snapshotId:guid}")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType(typeof(PublicIpAssessmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> GetAssessment(
        Guid snapshotId,
        [FromQuery] int page = PaginationDefaults.DefaultPage,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        if (productLine.GetEffectiveProductLine() != EffectiveProductLineKind.Security || !options.Value.Allows(scope))
            return this.NotFoundProblem(NotFoundDetail, ProblemTypes.ResourceNotFound);

        if (snapshotId == Guid.Empty || page < 1 || pageSize is < 1 or > PaginationDefaults.MaxPageSize)
            return this.BadRequestProblem("A snapshot ID and valid pagination are required.", ProblemTypes.ValidationFailed);

        try
        {
            PublicIpAssessmentResponse? result = await assessment.TryGetAsync(scope, snapshotId, page, pageSize, cancellationToken);
            return result is not null
                ? Ok(result)
                : this.NotFoundProblem(NotFoundDetail, ProblemTypes.ResourceNotFound);
        }
        catch (ConflictException)
        {
            return this.ConflictProblem("The snapshot evidence could not be verified.", ProblemTypes.Conflict);
        }
    }
}
