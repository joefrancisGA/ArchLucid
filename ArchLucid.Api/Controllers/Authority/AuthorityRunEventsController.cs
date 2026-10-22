using System.Text;
using System.Text.Json;

using ArchLucid.Api.Contracts;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Support;
using ArchLucid.Application;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
///     Server-sent events stream for run summary polling (operator UI). Sends periodic <c>status</c> events and a terminal
///     <c>complete</c> event.
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/authority")]
[EnableRateLimiting("fixed")]
public sealed partial class AuthorityRunEventsController(
    IAuthorityQueryService queryService,
    IScopeContextProvider scopeProvider,
    IManifestHashService manifestHashService) : ControllerBase
{
    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    /// <summary>
    ///     Streams <c>text/event-stream</c> with run summary JSON until golden manifest is ready or the server times out
    ///     (~5 minutes).
    /// </summary>
    [HttpGet("runs/{runId:guid}/events")]
    [Produces("text/event-stream")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task GetRunEvents(Guid runId, CancellationToken cancellationToken)
    {
        try
        {
            ScopeContext scope = scopeProvider.GetCurrentScope();
            RunDetailDto? detail = await queryService.GetRunDetailAsync(scope, runId, cancellationToken);

            if (detail is not null)
            {
                IActionResult? sealedGuardResult = EnsureGoldenManifestSealedReadAllowed(detail, runId);

                if (sealedGuardResult is not null)
                {
                    await sealedGuardResult.ExecuteResultAsync(new ActionContext { HttpContext = HttpContext });
                    return;
                }
            }

            Response.Headers.ContentType = "text/event-stream";
            Response.Headers.CacheControl = "no-cache";
            Response.Headers.Connection = "keep-alive";

            DateTime startedUtc = TimeProvider.System.UtcNowDateTime();
            TimeSpan maxDuration = TimeSpan.FromMinutes(5);
            TimeSpan pollInterval = TimeSpan.FromSeconds(2);
            string? lastPayloadFingerprint = null;

            while (!cancellationToken.IsCancellationRequested
                   && TimeProvider.System.UtcNowDateTime() - startedUtc <= maxDuration)
            {
                RunSummaryDto? summaryDto = await queryService.GetRunSummaryAsync(scope, runId, cancellationToken);

                if (summaryDto is null)
                {
                    await WriteSseEventAsync("error", """{"detail":"Run summary not found"}""", cancellationToken);
                    await WriteSseEventAsync("complete", """{"reason":"not-found"}""", cancellationToken);

                    return;
                }

                RunSummaryResponse body = ToRunSummaryResponse(summaryDto);
                string json = JsonSerializer.Serialize(body, SerializerOptions);

                if (!string.Equals(json, lastPayloadFingerprint, StringComparison.Ordinal))
                {
                    lastPayloadFingerprint = json;
                    await WriteSseEventAsync("status", json, cancellationToken);
                }

                if (summaryDto.HasGoldenManifest)
                {
                    await WriteSseEventAsync("complete", """{"reason":"golden-manifest-ready"}""", cancellationToken);

                    return;
                }

                await Task.Delay(pollInterval, cancellationToken);
            }

            await WriteSseEventAsync("complete", """{"reason":"timeout"}""", cancellationToken);
        }
        catch (ConflictException ex)
        {
            await MapRunEventsSealedManifestConflict(ex)
                .ExecuteResultAsync(new ActionContext { HttpContext = HttpContext });
        }
    }

    private async Task WriteSseEventAsync(string eventName, string data, CancellationToken cancellationToken)
    {
        string id = Guid.NewGuid().ToString("N");
        StringBuilder sb = new();
        sb.Append("id: ").Append(id).Append('\n');
        sb.Append("event: ").Append(eventName).Append('\n');
        sb.Append("data: ");

        foreach (string line in data.Replace("\r\n", "\n").Replace('\r', '\n').Split('\n'))

            sb.Append(line).Append('\n');

        sb.Append('\n');
        byte[] bytes = Encoding.UTF8.GetBytes(sb.ToString());
        await Response.Body.WriteAsync(bytes, cancellationToken);
        await Response.Body.FlushAsync(cancellationToken);
    }

    private static RunSummaryResponse ToRunSummaryResponse(RunSummaryDto x) =>
        AuthorityRunReadHandlers.ToRunSummaryResponse(x);
}
