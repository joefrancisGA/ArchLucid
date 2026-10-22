using System.Globalization;
using System.Text.Json;

using ArchLucid.Api.Http;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Trust;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>
///     Records publication of a procurement-facing security assessment (emits
///     <see cref="AuditEventTypes.SecurityAssessmentPublished" />).
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/security-trust")]
public sealed class SecurityTrustPublicationController(IAuditService auditService) : ControllerBase
{
    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    /// <summary>Append a durable audit row marking the assessment as published for trust-center and SIEM consumers.</summary>
    [HttpPost("publications")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PublishAsync(
        [FromBody] SecurityAssessmentPublicationRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (string.IsNullOrWhiteSpace(body.AssessmentCode))
            return this.BadRequestProblem("AssessmentCode is required.", ProblemTypes.ValidationFailed);

        if (!UnicodeTextValidation.IsValidUnicodeText(body.AssessmentCode))
        {
            return this.BadRequestProblem(
                "AssessmentCode must not contain invalid Unicode surrogate pairs.",
                ProblemTypes.ValidationFailed);
        }

        if (string.IsNullOrWhiteSpace(body.SummaryReference))
            return this.BadRequestProblem("SummaryReference is required.", ProblemTypes.ValidationFailed);

        if (!UnicodeTextValidation.IsValidUnicodeText(body.SummaryReference))
        {
            return this.BadRequestProblem(
                "SummaryReference must not contain invalid Unicode surrogate pairs.",
                ProblemTypes.ValidationFailed);
        }

        if (body.AssessorDisplayName is { } assessorDisplayName
            && !UnicodeTextValidation.IsValidUnicodeText(assessorDisplayName))
        {
            return this.BadRequestProblem(
                "AssessorDisplayName must not contain invalid Unicode surrogate pairs.",
                ProblemTypes.ValidationFailed);
        }

        if (!string.IsNullOrWhiteSpace(body.PublishedOn))
        {
            if (!DateOnly.TryParse(body.PublishedOn.Trim(), CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
                return this.BadRequestProblem("PublishedOn must be a calendar date (YYYY-MM-DD).",
                    ProblemTypes.ValidationFailed);
        }

        string payload = JsonSerializer.Serialize(
            new
            {
                assessmentCode = body.AssessmentCode.Trim(),
                summaryReference = body.SummaryReference.Trim(),
                assessorDisplayName = body.AssessorDisplayName?.Trim(),
                publishedOn = string.IsNullOrWhiteSpace(body.PublishedOn) ? null : body.PublishedOn.Trim()
            });

        await _auditService.LogAsync(
            new AuditEvent { EventType = AuditEventTypes.SecurityAssessmentPublished, DataJson = payload },
            cancellationToken);

        return NoContent();
    }
}
