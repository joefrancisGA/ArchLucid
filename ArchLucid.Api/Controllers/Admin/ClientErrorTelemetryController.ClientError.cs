using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Telemetry;
using ArchLucid.Core.Diagnostics;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

public sealed partial class ClientErrorTelemetryController
{
    /// <summary>Records a client-side error report at Warning level (sanitized).</summary>
    // idempotency-posture: inbound-webhook-pipeline
    [HttpPost("client-error")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult PostClientError([FromBody] ClientErrorReport? body)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.ValidationFailed);

        string message = body.Message.Trim();

        if (message.Length == 0)
            return this.BadRequestProblem("Message is required.", ProblemTypes.ValidationFailed);

        if (message.Length > ClientErrorTelemetryIngestLimits.MaxMessageLength)
            return this.BadRequestProblem(
                $"Message must be at most {ClientErrorTelemetryIngestLimits.MaxMessageLength} characters.",
                ProblemTypes.ValidationFailed);

        string? stack = TruncateNullable(body.Stack, ClientErrorTelemetryIngestLimits.MaxStackLength);
        string? pathname = TruncateNullable(body.Pathname, ClientErrorTelemetryIngestLimits.MaxPathnameLength);
        string? userAgent = TruncateNullable(body.UserAgent, ClientErrorTelemetryIngestLimits.MaxUserAgentLength);
        string? timestampUtc = TruncateNullable(body.TimestampUtc, 64);

        if (body.Context is not null)
        {
            if (body.Context.Count > ClientErrorTelemetryIngestLimits.MaxContextEntries)
                return this.BadRequestProblem(
                    $"Context may contain at most {ClientErrorTelemetryIngestLimits.MaxContextEntries} entries.",
                    ProblemTypes.ValidationFailed);

            foreach (KeyValuePair<string, string> pair in body.Context)

                if (pair.Key.Length > ClientErrorTelemetryIngestLimits.MaxContextKeyLength
                    || pair.Value.Length > ClientErrorTelemetryIngestLimits.MaxContextValueLength)

                    return this.BadRequestProblem(
                        $"Context keys must be at most {ClientErrorTelemetryIngestLimits.MaxContextKeyLength} characters and values at most {ClientErrorTelemetryIngestLimits.MaxContextValueLength} characters.",
                        ProblemTypes.ValidationFailed);
        }

        if (_logger.IsEnabled(LogLevel.Warning))
            _logger.LogWarningOperatorShellClientError(message, pathname, userAgent, timestampUtc, stack);

        return NoContent();
    }

    private static string? TruncateNullable(string? value, int maxLen)
    {
        if (string.IsNullOrEmpty(value))
            return null;

        string trimmed = value.Trim();

        return trimmed.Length <= maxLen ? trimmed : trimmed[..maxLen];
    }
}
