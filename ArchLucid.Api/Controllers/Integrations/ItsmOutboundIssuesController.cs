using System.Text.Json;

using ArchLucid.Api.Models;
using ArchLucid.Api.Models.Integrations;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Application.Jobs;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.Serialization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Integrations;

/// <summary>First-party outbound Jira issue / ServiceNow incident creation from authority findings.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/integrations/itsm/outbound/issues")]
[EnableRateLimiting("fixed")]
public sealed class ItsmOutboundIssuesController(
    IScopeContextProvider scopeProvider,
    IItsmOutboundIssueCreationService issueCreation,
    ItsmNativeIntegrationGate nativeIntegrationGate,
    IAuditService auditService,
    IBackgroundJobQueue jobs,
    IOptionsMonitor<IntegrationsItsmOutboundOptions> outboundOptions) : ControllerBase
{
    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IItsmOutboundIssueCreationService _issueCreation =
        issueCreation ?? throw new ArgumentNullException(nameof(issueCreation));

    private readonly ItsmNativeIntegrationGate _nativeIntegrationGate =
        nativeIntegrationGate ?? throw new ArgumentNullException(nameof(nativeIntegrationGate));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IBackgroundJobQueue _jobs = jobs ?? throw new ArgumentNullException(nameof(jobs));

    private readonly IOptionsMonitor<IntegrationsItsmOutboundOptions> _outboundOptions =
        outboundOptions ?? throw new ArgumentNullException(nameof(outboundOptions));

    /// <summary>Creates an external ticket from the persisted finding in the current scope.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost]
    [ProducesResponseType(typeof(CreateItsmOutboundIssueResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(AsyncJobResponse), StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> CreateAsync([FromBody] CreateItsmOutboundIssueRequest? body, CancellationToken ct)
    {
        if (!_nativeIntegrationGate.IsNativeCreateEnabled())
        {
            return this.NotFoundProblem(
                ItsmNativeIntegrationGate.NativeCreateDisabledMessage,
                ProblemTypes.ResourceNotFound);
        }

        if (body is null)
            return this.BadRequestProblem("body is required.", ProblemTypes.RequestBodyRequired);

        if (string.IsNullOrWhiteSpace(body.FindingId))
            return this.BadRequestProblem(
                "findingId is required.",
                ProblemTypes.ValidationFailed,
                extensions: ItsmProblemExtensions(TrimOrNull(body.Provider), null));

        string findingTrimmed = body.FindingId.Trim();

        if (string.IsNullOrWhiteSpace(body.Provider))
            return this.BadRequestProblem(
                "provider is required.",
                ProblemTypes.ValidationFailed,
                extensions: ItsmProblemExtensions(null, findingTrimmed));

        if (!TryMapProvider(body.Provider, out ItsmOutboundIssueProvider provider))
            return this.BadRequestProblem(
                "provider must be Jira, ServiceNow, or Azure Boards.",
                ProblemTypes.ValidationFailed,
                extensions: ItsmProblemExtensions(body.Provider.Trim(), findingTrimmed));

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        if (_outboundOptions.CurrentValue.DurableAsyncCreateEnabled)
        {
            string providerLabel = ToProviderLabel(provider);
            string correlationId = $"{providerLabel.ToLowerInvariant()}-outbound-create:{findingTrimmed}:{Guid.NewGuid():N}";

            ItsmOutboundCreateJobPayload payload = new(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                findingTrimmed,
                provider,
                correlationId);

            IntegrationsItsmOutboundOptions options = _outboundOptions.CurrentValue;
            int maxRetries = Math.Clamp(options.AsyncCreateMaxRetries, 0, 10);

            string jobId = await _jobs
                .EnqueueAsync(new ItsmOutboundCreateWorkUnit(payload), maxRetries, ct)
                .ConfigureAwait(false);

            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.IntegrationItsmOutboundCreateEnqueued,
                    CorrelationId = correlationId,
                    DataJson = JsonSerializer.Serialize(
                        new { jobId, findingId = findingTrimmed, provider = providerLabel },
                        AuditJsonSerializationOptions.Instance)
                },
                ct).ConfigureAwait(false);

            return Accepted(new AsyncJobResponse { JobId = jobId });
        }

        ItsmOutboundIssueCreationResult result = await _issueCreation
            .TryCreateForFindingAsync(provider, scope, findingTrimmed, ct)
            .ConfigureAwait(false);

        return await MapSyncCreateResultAsync(result, provider, findingTrimmed, ct).ConfigureAwait(false);
    }

    private async Task<IActionResult> MapSyncCreateResultAsync(
        ItsmOutboundIssueCreationResult result,
        ItsmOutboundIssueProvider provider,
        string findingTrimmed,
        CancellationToken ct)
    {
        foreach (AuditEvent auditEvent in result.AuditEvents)
            await _auditService.LogAsync(auditEvent, ct).ConfigureAwait(false);

        string providerLabel = ToProviderLabel(provider);

        IReadOnlyDictionary<string, object?>? scopeExtensions = ItsmProblemExtensions(providerLabel, findingTrimmed);

        return result.Kind switch
        {
            ItsmOutboundCreateTerminalKind.Succeeded => Ok(
                new CreateItsmOutboundIssueResponse(providerLabel, result.ExternalKey)),
            ItsmOutboundCreateTerminalKind.Skipped => this.BadRequestProblem(
                result.UserMessage ?? "Request was skipped.",
                ProblemTypes.ValidationFailed,
                extensions: scopeExtensions),
            ItsmOutboundCreateTerminalKind.NotDecisionGrade => this.UnprocessableEntityProblem(
                result.UserMessage ?? "Finding is not eligible for ITSM export.",
                ProblemTypes.ValidationFailed,
                extensions: scopeExtensions),
            ItsmOutboundCreateTerminalKind.CorrelationPersistenceFailed => this.ServiceUnavailableProblem(
                result.UserMessage ?? "Ticket was created upstream but correlation could not be persisted.",
                ProblemTypes.UpstreamIntegrationFailed,
                extensions: scopeExtensions),
            ItsmOutboundCreateTerminalKind.VendorError when IsNotFoundMessage(result.UserMessage) =>
                this.NotFoundProblem(
                    result.UserMessage ?? "Resource not found.",
                    ProblemTypes.ResourceNotFound,
                    extensions: scopeExtensions),
            ItsmOutboundCreateTerminalKind.VendorError => VendorProblem(result, scopeExtensions),
            _ => this.BadRequestProblem(
                "Unexpected outcome.",
                ProblemTypes.ValidationFailed,
                extensions: scopeExtensions)
        };
    }

    private static bool IsNotFoundMessage(string? message) =>
        message is not null &&
        message.Contains("not found", StringComparison.OrdinalIgnoreCase);

    private IActionResult VendorProblem(
        ItsmOutboundIssueCreationResult result,
        IReadOnlyDictionary<string, object?>? extensions)
    {
        int? code = result.VendorStatusCode;

        if (code is 401 or 403 or 404 or 429 or >= 500 and <= 599)
            return this.ServiceUnavailableProblem(
                result.UserMessage ?? "Upstream ITSM request failed.",
                ProblemTypes.UpstreamIntegrationFailed,
                extensions: extensions);

        return this.BadRequestProblem(
            result.UserMessage ?? "ITSM request failed.",
            ProblemTypes.ValidationFailed,
            extensions: extensions);
    }

    private static string? TrimOrNull(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    /// <summary>Optional RFC 9457 extensions so operators can tie errors to ITSM provider + finding without reading prose.</summary>
    private static Dictionary<string, object?>? ItsmProblemExtensions(string? providerLabel, string? findingId)
    {
        Dictionary<string, object?> ext = [];

        if (!string.IsNullOrWhiteSpace(providerLabel))
            ext["provider"] = providerLabel.Trim();

        if (!string.IsNullOrWhiteSpace(findingId))
            ext["findingId"] = findingId.Trim();

        return ext.Count > 0 ? ext : null;
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
        {
            if (!s.Equals("AzureBoards", StringComparison.OrdinalIgnoreCase)
                && !s.Equals("Azure Boards", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            provider = ItsmOutboundIssueProvider.AzureBoards;

            return true;
        }

        provider = ItsmOutboundIssueProvider.ServiceNow;

        return true;
    }

    private static string ToProviderLabel(ItsmOutboundIssueProvider provider) =>
        provider switch
        {
            ItsmOutboundIssueProvider.Jira => "Jira",
            ItsmOutboundIssueProvider.ServiceNow => "ServiceNow",
            ItsmOutboundIssueProvider.AzureBoards => "Azure Boards",
            _ => throw new ArgumentOutOfRangeException(nameof(provider), provider, null)
        };
}
