using System.Net;
using System.Text.Json;

using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using Gen = ArchLucid.Api.Client.Generated;

namespace ArchLucid.Cli;

/// <summary>
///     Architecture run reads, agent-result submission, and run-scoped lookups.
/// </summary>
public sealed partial class ArchLucidApiClient
{
    /// <summary>
    ///     Submit an agent result for a run.
    /// </summary>
    public async Task<SubmitResultResult?> SubmitAgentResultAsync(string runId, AgentResult result,
        CancellationToken ct = default)
    {
        try
        {
            result.RunId = runId;
            Gen.AgentResult? genResult = MapToGenerated(result);

            if (genResult is null)
                return new SubmitResultResult(false, null, "Invalid agent result payload.");

            Gen.SubmitAgentResultRequest req = new() { Result = genResult };
            Gen.Body75? body = MapToOpenApiRequestBody<Gen.Body75>(req, GenNumericEnumBridgeJson);
            Gen.SubmitAgentResultResponse parsed = await _api.ResultPOSTAsync(runId, body, ct);

            return new SubmitResultResult(true, parsed.ResultId, null);
        }
        catch (Gen.ArchLucidApiException ex)
        {
            return new SubmitResultResult(false, null, ResolveApiErrorMessage(ex), ex.StatusCode);
        }
        catch (HttpRequestException ex)
        {
            return new SubmitResultResult(false, null, $"Cannot connect to ArchLucid API: {ex.Message}");
        }
        catch (TaskCanceledException)
        {
            return new SubmitResultResult(false, null, "Request timed out.");
        }
    }

    /// <summary>Normalized API base URL used by this client (no trailing slash).</summary>
    public string ResolvedBaseUrl =>
        (_http.BaseAddress?.ToString() ?? string.Empty).Trim().TrimEnd('/');

    /// <summary>
    ///     Bounded audit event id listing for support triage (ids only; non-fatal on auth/scope failure).
    /// </summary>
    public async Task<IReadOnlyList<string>> TryFetchRecentAuditEventIdsAsync(
        string? runId,
        int take,
        CancellationToken ct = default)
    {
        if (take <= 0)
            return [];

        try
        {
            string path = string.IsNullOrWhiteSpace(runId)
                ? $"v1/audit?take={take}"
                : $"v1/audit/search?take={take}&runId={Uri.EscapeDataString(runId)}";

            using HttpResponseMessage response = await _http.GetAsync(path, ct);

            if (response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
                return [];

            if (!response.IsSuccessStatusCode)
                return [];

            string json = await response.Content.ReadAsStringAsync(ct);
            AuditEventIdPage? page = JsonSerializer.Deserialize<AuditEventIdPage>(json, ContractEnumAwareJson);

            if (page?.Items is null || page.Items.Count == 0)
                return [];

            return page.Items
                .Select(i => i.EventId)
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Select(id => id!)
                .Take(take)
                .ToList();
        }
        catch (Exception ex)
        {
            LogCliFailure("Audit triage index", ex);

            return [];
        }
    }

    /// <summary>
    ///     Artifact ids for a run when ReadAuthority allows artifact listing (non-fatal on failure).
    /// </summary>
    public async Task<IReadOnlyList<string>> TryListArtifactIdsForRunAsync(string runId, CancellationToken ct = default)
    {
        if (!Guid.TryParse(runId, out Guid runGuid))
            return [];

        try
        {
            System.Collections.Generic.ICollection<Gen.ArtifactDescriptorResponse> artifacts =
                await _api.ArtifactsAllAsync(runGuid, ct);

            return artifacts
                .Where(a => a.ArtifactId is not null)
                .Select(a => a.ArtifactId!.Value.ToString("D", System.Globalization.CultureInfo.InvariantCulture))
                .ToList();
        }
        catch (Exception ex)
        {
            LogCliFailure($"ArtifactsAll({runId})", ex);

            return [];
        }
    }

    /// <summary>
    ///     Get run status, tasks, and results.
    /// </summary>
    public async Task<GetRunResult?> GetRunAsync(string runId, CancellationToken ct = default)
    {
        try
        {
            Gen.RunDetailsResponse details = await _api.ReviewAsync(runId, ct);

            return DeserializeRoundTrip<GetRunResult>(details);
        }
        catch (Exception ex)
        {
            LogCliFailure($"GetRun({runId})", ex);

            return null;
        }
    }

    /// <summary>
    ///     Get manifest by version.
    /// </summary>
    public async Task<object?> GetManifestAsync(string version, CancellationToken ct = default)
    {
        try
        {
            Gen.GoldenManifest manifest = await _api.ManifestAsync(version, ct);

            return JsonSerializer.SerializeToElement(manifest, _jsonOptions);
        }
        catch (Exception ex)
        {
            LogCliFailure($"GetManifest({version})", ex);

            return null;
        }
    }
}
