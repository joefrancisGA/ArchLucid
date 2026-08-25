using ArchLucid.Api.Marketing;
using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers;

/// <summary>Anonymous tenant self-registration (Free tier).</summary>
[ApiController]
[AllowAnonymous]
[AllowUnscopedRoute]
[EnableRateLimiting("registration")]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/register")]
public sealed class RegistrationController(IRegistrationApplicationService registration) : ControllerBase
{
    private readonly IRegistrationApplicationService _registration =
        registration ?? throw new ArgumentNullException(nameof(registration));

    /// <summary>Creates a Free-tier tenant and default workspace (idempotent by organization slug).</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost]
    [ProducesResponseType(typeof(TenantProvisioningResult), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(TenantProvisioningResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status500InternalServerError)]
    [MutatingAuditExcluded("Audit: IRegistrationApplicationService.RegisterAsync logs TrialSignupAttempted, TenantSelfRegistered, TrialRegistrationFailed, and TrialBaselineReviewCycleCaptured.")]
    public async Task<IActionResult> RegisterAsync(
        [FromBody] TenantRegistrationRequest? body,
        CancellationToken cancellationToken = default)
    {
        TenantSelfRegistrationRequest? request = body is null ? null : MapToApplicationRequest(body);
        RegistrationResult result = await _registration.RegisterAsync(request, cancellationToken);

        return result.Outcome switch
        {
            RegistrationOutcome.Created => StatusCode(StatusCodes.Status201Created, result.Provisioned),
            RegistrationOutcome.InviteOnly => this.NotFoundProblem(result.UserMessage, ProblemTypes.ResourceNotFound),
            RegistrationOutcome.BodyRequired => this.BadRequestProblem(
                result.UserMessage,
                ProblemTypes.RequestBodyRequired),
            RegistrationOutcome.ValidationFailed => this.BadRequestProblem(
                result.UserMessage,
                ProblemTypes.ValidationFailed),
            RegistrationOutcome.Conflict => this.ConflictProblem(result.UserMessage, ProblemTypes.Conflict),
            RegistrationOutcome.InternalError => this.InternalServerErrorProblem(result.UserMessage),
            _ => throw new InvalidOperationException($"Unexpected registration outcome {result.Outcome}."),
        };
    }

    private TenantSelfRegistrationRequest MapToApplicationRequest(TenantRegistrationRequest body) =>
        new()
        {
            OrganizationName = body.OrganizationName,
            AdminEmail = body.AdminEmail,
            AdminDisplayName = body.AdminDisplayName,
            BaselineReviewCycleHours = body.BaselineReviewCycleHours,
            BaselineReviewCycleSource = body.BaselineReviewCycleSource,
            CompanySize = body.CompanySize,
            ArchitectureTeamSize = body.ArchitectureTeamSize,
            IndustryVertical = body.IndustryVertical,
            IndustryVerticalOther = body.IndustryVerticalOther,
            ClientIp = HttpContext.Connection.RemoteIpAddress?.ToString(),
            FirstTouch = MarketingAttributionHeaderParser.TryParse(
                Request.Headers["x-archlucid-first-touch"].FirstOrDefault(),
                TimeProvider.System)
        };
}
