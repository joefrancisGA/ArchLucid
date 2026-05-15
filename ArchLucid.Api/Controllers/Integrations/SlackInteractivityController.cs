using System.Text.Json;
using System.Web;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Notifications;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Integrations;

/// <summary>
///     Receives Slack interactivity callbacks (<c>block_actions</c>) from governance approval Block Kit buttons.
///     Verifies the Slack request signature against the tenant-configured <c>SlackSigningSecret</c>
///     before dispatching approve/reject actions.
/// </summary>
[AllowAnonymous]
[ApiController]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/integrations/webhooks/slack")]
public sealed class SlackInteractivityController(
    ISlackInteractivityVerifier verifier,
    IGovernanceWorkflowService workflowService,
    IAuditService auditService,
    IOptionsMonitor<ChatOpsIncomingWebhooksOptions> chatOpsOptions,
    ILogger<SlackInteractivityController> logger) : ControllerBase
{
    private const string ApprovePrefix = "governance_approve:";
    private const string RejectPrefix = "governance_reject:";
    private const string SlackActorName = "slack-interactive";

    private readonly ISlackInteractivityVerifier _verifier =
        verifier ?? throw new ArgumentNullException(nameof(verifier));

    private readonly IGovernanceWorkflowService _workflowService =
        workflowService ?? throw new ArgumentNullException(nameof(workflowService));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IOptionsMonitor<ChatOpsIncomingWebhooksOptions> _chatOpsOptions =
        chatOpsOptions ?? throw new ArgumentNullException(nameof(chatOpsOptions));

    private readonly ILogger<SlackInteractivityController> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <summary>
    ///     Receives a Slack <c>block_actions</c> interactivity payload. The URL-form-encoded body contains a
    ///     <c>payload</c> key whose value is a JSON object. Signature is verified before any action is taken.
    ///     Returns <c>200 OK</c> on success (Slack requires 200 to suppress the "This app didn't respond" message),
    ///     and <c>400</c> or <c>401</c> on verification failure.
    /// </summary>
    [HttpPost("interactivity")]
    [Consumes("application/x-www-form-urlencoded")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> HandleInteractivity(CancellationToken ct = default)
    {
        string rawBody;

        Request.EnableBuffering();

        using (StreamReader reader = new(Request.Body, leaveOpen: true))
        {
            rawBody = await reader.ReadToEndAsync(ct);
            Request.Body.Position = 0;
        }

        string timestamp = Request.Headers["X-Slack-Request-Timestamp"].FirstOrDefault() ?? string.Empty;
        string signature = Request.Headers["X-Slack-Signature"].FirstOrDefault() ?? string.Empty;

        if (!_verifier.Verify(rawBody, timestamp, signature))
        {
            _logger.LogWarning("Slack interactivity request failed signature verification.");

            return Unauthorized();
        }

        string payloadJson = HttpUtility.ParseQueryString(rawBody)["payload"] ?? string.Empty;

        if (string.IsNullOrWhiteSpace(payloadJson))
            return this.BadRequestProblem(
                "The Slack interactivity callback is missing the 'payload' form field.",
                ProblemTypes.ValidationFailed);

        using JsonDocument doc = JsonDocument.Parse(payloadJson);
        JsonElement root = doc.RootElement;

        if (!root.TryGetProperty("type", out JsonElement typeEl) ||
            typeEl.GetString() != "block_actions")
            return Ok();

        if (!root.TryGetProperty("actions", out JsonElement actionsEl))
            return Ok();

        int slackGovernanceDispatches = 0;

        foreach (JsonElement action in actionsEl.EnumerateArray())
        {
            string? value = action.TryGetProperty("value", out JsonElement valEl)
                ? valEl.GetString()
                : null;

            if (string.IsNullOrWhiteSpace(value))
                continue;

            if (value.StartsWith(ApprovePrefix, StringComparison.Ordinal))
            {
                string approvalRequestId = value[ApprovePrefix.Length..];

                slackGovernanceDispatches++;

                await ProcessApproveAsync(approvalRequestId, ct);
            }
            else if (value.StartsWith(RejectPrefix, StringComparison.Ordinal))
            {
                string approvalRequestId = value[RejectPrefix.Length..];

                slackGovernanceDispatches++;

                await ProcessRejectAsync(approvalRequestId, ct);
            }
        }

        if (slackGovernanceDispatches > 0)
        {
            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.GovernanceSlackInteractivityDispatched,
                    DataJson = System.Text.Json.JsonSerializer.Serialize(new { actionCount = slackGovernanceDispatches })
                },
                ct);
        }

        return Ok();
    }

    private async Task ProcessApproveAsync(string approvalRequestId, CancellationToken ct)
    {
        try
        {
            await _workflowService.ApproveAsync(
                approvalRequestId,
                reviewedBy: SlackActorName,
                reviewedByActorKey: SlackActorName,
                reviewComment: "Approved via Slack interactive action.",
                cancellationToken: ct);

            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.GovernanceApprovalApproved,
                    DataJson = System.Text.Json.JsonSerializer.Serialize(new
                    {
                        source = "slack_interactivity",
                        approvalRequestId
                    })
                }, ct);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex,
                "Slack interactivity: approve failed for approval request '{ApprovalRequestId}'.",
                approvalRequestId);
        }
    }

    private async Task ProcessRejectAsync(string approvalRequestId, CancellationToken ct)
    {
        try
        {
            await _workflowService.RejectAsync(
                approvalRequestId,
                reviewedBy: SlackActorName,
                reviewedByActorKey: SlackActorName,
                reviewComment: "Rejected via Slack interactive action.",
                cancellationToken: ct);

            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.GovernanceApprovalRejected,
                    DataJson = System.Text.Json.JsonSerializer.Serialize(new
                    {
                        source = "slack_interactivity",
                        approvalRequestId
                    })
                }, ct);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex,
                "Slack interactivity: reject failed for approval request '{ApprovalRequestId}'.",
                approvalRequestId);
        }
    }
}
