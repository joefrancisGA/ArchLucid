using ArchLucid.Api.Models.Integrations;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Integrations;

/// <summary>First-party outbound Jira issue / ServiceNow incident creation from authority findings.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/integrations/itsm/outbound/issues")]
[EnableRateLimiting("fixed")]
public sealed class ItsmOutboundIssuesController(
    IScopeContextProvider scopeProvider,
    ItsmOutboundIssueCreationService issueCreation,
    IAuditService auditService) : ControllerBase
{
    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly ItsmOutboundIssueCreationService _issueCreation =
        issueCreation ?? throw new ArgumentNullException(nameof(issueCreation));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    /// <summary>Creates an external ticket from the persisted finding in the current scope.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(CreateItsmOutboundIssueResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> CreateAsync([FromBody] CreateItsmOutboundIssueRequest? body, CancellationToken ct)
    {
        if (body is null)
            return this.BadRequestProblem("body is required.", ProblemTypes.RequestBodyRequired);

        if (string.IsNullOrWhiteSpace(body.FindingId))
            return this.BadRequestProblem("findingId is required.", ProblemTypes.ValidationFailed);

        if (string.IsNullOrWhiteSpace(body.Provider))
            return this.BadRequestProblem("provider is required.", ProblemTypes.ValidationFailed);

        if (!TryMapProvider(body.Provider, out ItsmOutboundIssueProvider provider))
            return this.BadRequestProblem("provider must be Jira or ServiceNow.", ProblemTypes.ValidationFailed);

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        ItsmOutboundIssueCreationResult result = await _issueCreation
            .TryCreateForFindingAsync(provider, scope, body.FindingId.Trim(), ct)
            .ConfigureAwait(false);

        foreach (AuditEvent auditEvent in result.AuditEvents)
            await _auditService.LogAsync(auditEvent, ct).ConfigureAwait(false);

        string providerLabel = provider is ItsmOutboundIssueProvider.Jira ? "Jira" : "ServiceNow";

        return result.Kind switch
        {
            ItsmOutboundCreateTerminalKind.Succeeded => Ok(
                new CreateItsmOutboundIssueResponse(providerLabel, result.ExternalKey)),
            ItsmOutboundCreateTerminalKind.Skipped => this.BadRequestProblem(
                result.UserMessage ?? "Request was skipped.",
                ProblemTypes.ValidationFailed),
            ItsmOutboundCreateTerminalKind.CorrelationPersistenceFailed => this.ServiceUnavailableProblem(
                result.UserMessage ?? "Ticket was created upstream but correlation could not be persisted.",
                ProblemTypes.UpstreamIntegrationFailed),
            ItsmOutboundCreateTerminalKind.VendorError when IsNotFoundMessage(result.UserMessage) =>
                this.NotFoundProblem(result.UserMessage ?? "Resource not found.", ProblemTypes.ResourceNotFound),
            ItsmOutboundCreateTerminalKind.VendorError => VendorProblem(result),
            _ => this.BadRequestProblem("Unexpected outcome.", ProblemTypes.ValidationFailed)
        };
    }

    private static bool IsNotFoundMessage(string? message) =>
        message is not null &&
        message.Contains("not found", StringComparison.OrdinalIgnoreCase);

    private IActionResult VendorProblem(ItsmOutboundIssueCreationResult result)
    {
        int? code = result.VendorStatusCode;

        if (code is 401 or 403 or 404 or 429 or >= 500 and <= 599)
            return this.ServiceUnavailableProblem(
                result.UserMessage ?? "Upstream ITSM request failed.",
                ProblemTypes.UpstreamIntegrationFailed);

        return this.BadRequestProblem(result.UserMessage ?? "ITSM request failed.", ProblemTypes.ValidationFailed);
    }

    private static bool TryMapProvider(string raw, out ItsmOutboundIssueProvider provider)
    {
        provider = ItsmOutboundIssueProvider.Jira;

        if (string.IsNullOrWhiteSpace(raw))
            return false;

        string s = raw.Trim();

        if (s.Equals("Jira", StringComparison.OrdinalIgnoreCase))
        {
            provider = ItsmOutboundIssueProvider.Jira;

            return true;
        }

        if (!s.Equals("ServiceNow", StringComparison.OrdinalIgnoreCase))
            return false;

        provider = ItsmOutboundIssueProvider.ServiceNow;

        return true;

    }
}
