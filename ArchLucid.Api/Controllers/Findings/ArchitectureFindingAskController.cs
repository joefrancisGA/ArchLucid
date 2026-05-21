using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Ask;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Findings;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture/finding")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class ArchitectureFindingAskController(
    IAskService askService,
    IScopeContextProvider scopeContextProvider,
    ILogger<ArchitectureFindingAskController> logger) : ControllerBase
{
    private readonly IAskService _askService = askService ?? throw new ArgumentNullException(nameof(askService));
    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));
    private readonly ILogger<ArchitectureFindingAskController> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    [HttpPost("{findingId:guid}/ask")]
    [MutatingAuditExcluded("Conversation persistence in IAskService handles auditing-related writes.")]
    [ProducesResponseType(typeof(AskResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AskAboutFinding(
        [FromRoute] Guid findingId,
        [FromBody] FindingAskRequest? request,
        CancellationToken cancellationToken)
    {

        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);


        if (string.IsNullOrWhiteSpace(request.Question))
            return this.BadRequestProblem("Question is required.", ProblemTypes.ValidationFailed);

        request.FindingId = findingId;

        try
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            AskResponse response = await _askService.AskAboutFindingAsync(request, scope, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Finding ask failed for finding {FindingId}.", findingId);
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid finding ask request for finding {FindingId}.", findingId);
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
    }
}
