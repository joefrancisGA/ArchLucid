using System.Diagnostics.CodeAnalysis;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;

using Gen = ArchLucid.Api.Client.Generated;

namespace ArchLucid.Cli;

/// <summary>
///     Architecture run lifecycle: create, execute, commit, fingerprint, seed, and run-scoped lookups.
/// </summary>
public sealed partial class ArchLucidApiClient
{
    /// <summary>
    ///     Create an architecture run by submitting an ArchitectureRequest.
    /// </summary>
    public async Task<CreateRunResult> CreateRunAsync(
        ArchitectureRequest request,
        CancellationToken ct = default,
        string? idempotencyKey = null)
    {
        try
        {
            Gen.Body49? body = MapToOpenApiRequestBody<Gen.Body49>(MapToGenerated(request), GenNumericEnumBridgeJson);

            if (body is null)
                return CreateRunResult.Fail(null, "Invalid architecture request payload.");

            if (!string.IsNullOrWhiteSpace(idempotencyKey))
            {
                return await CreateRunWithIdempotencyHeaderAsync(MapToGenerated(request)!, idempotencyKey.Trim(), ct);
            }

            Gen.CreateArchitectureRunResponse created = await _api.RequestPOSTAsync(body, ct);
            CreateRunResponse? mapped = DeserializeRoundTrip<CreateRunResponse>(created);

            return CreateRunResult.Ok(mapped);
        }
        catch (Gen.ArchLucidApiException ex)
        {
            return CreateRunResult.Fail(ex.StatusCode, ResolveApiErrorMessage(ex), TryReadCorrelationId(ex));
        }
        catch (HttpRequestException ex)
        {
            return CreateRunResult.Fail(null, $"Cannot connect to ArchLucid API: {ex.Message}");
        }
        catch (TaskCanceledException)
        {
            return CreateRunResult.Fail(null, "Request timed out.");
        }
    }

    private async Task<CreateRunResult> CreateRunWithIdempotencyHeaderAsync(
        Gen.ArchitectureRequest body,
        string idempotencyKey,
        CancellationToken ct)
    {
        string json = JsonSerializer.Serialize(body, GenNumericEnumBridgeJson);
        using HttpRequestMessage request = new(HttpMethod.Post, "v1/architecture/request");
        request.Content = new StringContent(json, Encoding.UTF8, "application/json");
        request.Headers.TryAddWithoutValidation("Idempotency-Key", idempotencyKey);

        using HttpResponseMessage response = await _http.SendAsync(request, ct);
        string text = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            return CreateRunResult.Fail((int)response.StatusCode, ResolveApiErrorMessageFromBody(text), TryReadCorrelationIdFromHeaders(response.Headers));
        }

        Gen.CreateArchitectureRunResponse? created = JsonSerializer.Deserialize<Gen.CreateArchitectureRunResponse>(text, GenNumericEnumBridgeJson);
        CreateRunResponse? mapped = DeserializeRoundTrip<CreateRunResponse>(created);

        return CreateRunResult.Ok(mapped);
    }


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
            Gen.Body70? body = MapToOpenApiRequestBody<Gen.Body70>(req, GenNumericEnumBridgeJson);
            Gen.SubmitAgentResultResponse parsed = await _api.ResultAsync(runId, body, ct);

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
    ///     Commit a run: merge agent results and produce a versioned manifest.
    /// </summary>
    public async Task<CommitRunResult?> CommitRunAsync(string runId, CancellationToken ct = default)
    {
        try
        {
            Gen.CommitRunResponse result = await _api.FinalizeAsync(runId, null, ct);
            CommitRunResponse? mapped = DeserializeRoundTrip<CommitRunResponse>(result);

            return new CommitRunResult(true, mapped, null);
        }
        catch (Gen.ArchLucidApiException ex)
        {
            return new CommitRunResult(false, null, ResolveApiErrorMessage(ex), ex.StatusCode,
                TryReadCorrelationId(ex));
        }
        catch (HttpRequestException ex)
        {
            return new CommitRunResult(false, null, $"Cannot connect to ArchLucid API: {ex.Message}");
        }
        catch (TaskCanceledException)
        {
            return new CommitRunResult(false, null, "Request timed out.");
        }
    }

    /// <summary>POST <c>/v1/architecture/review/{runId}/execute</c> (simulator or real execution per API host configuration).</summary>
    public async Task<ExecuteRunResult?> ExecuteRunAsync(string runId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(runId))
            throw new ArgumentException("Run id is required.", nameof(runId));

        try
        {
            _ = await _api.ExecuteAsync(runId, ct);

            return new ExecuteRunResult(true, null);
        }
        catch (Gen.ArchLucidApiException ex)
        {
            return new ExecuteRunResult(false, ResolveApiErrorMessage(ex), ex.StatusCode, TryReadCorrelationId(ex));
        }
        catch (HttpRequestException ex)
        {
            return new ExecuteRunResult(false, $"Cannot connect to ArchLucid API: {ex.Message}");
        }
        catch (TaskCanceledException)
        {
            return new ExecuteRunResult(false, "Request timed out.");
        }
    }

    /// <summary>
    ///     Commits a run and returns a content SHA-256 fingerprint of the committed <see cref="GoldenManifest" />
    ///     (excludes per-run identity fields — see <see cref="GoldenManifestFingerprint.ComputeContentSha256Hex" />).
    /// </summary>
    public async Task<GoldenManifestFingerprintResult?> TryCommitAndFingerprintGoldenManifestAsync(string runId,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(runId))
            throw new ArgumentException("Run id is required.", nameof(runId));

        try
        {
            Gen.CommitRunResponse gen = await _api.FinalizeAsync(runId, null, ct);
            Gen.GoldenManifest? gm = gen.Manifest;

            if (gm is null)
                return new GoldenManifestFingerprintResult(false, null, "Commit response contained no manifest.");

            string wireJson = JsonSerializer.Serialize(gm, gm.GetType(), _jsonOptions);
            JsonSerializerOptions contractRead = new(ContractJson.Default) { PropertyNameCaseInsensitive = true };
            GoldenManifest? manifest = JsonSerializer.Deserialize<GoldenManifest>(wireJson, contractRead);

            if (manifest is null)
                return new GoldenManifestFingerprintResult(false, null,
                    "Manifest could not be deserialized to GoldenManifest.");

            string sha = GoldenManifestFingerprint.ComputeContentSha256Hex(manifest);

            return new GoldenManifestFingerprintResult(true, sha, null);
        }
        catch (Gen.ArchLucidApiException ex)
        {
            return new GoldenManifestFingerprintResult(false, null, ResolveApiErrorMessage(ex), ex.StatusCode);
        }
        catch (HttpRequestException ex)
        {
            return new GoldenManifestFingerprintResult(false, null, $"Cannot connect to ArchLucid API: {ex.Message}");
        }
        catch (TaskCanceledException)
        {
            return new GoldenManifestFingerprintResult(false, null, "Request timed out.");
        }
    }

    /// <summary>
    ///     Seed fake results for a run (Development only).
    /// </summary>
    public async Task<SeedFakeResultsResult?> SeedFakeResultsAsync(
        string runId,
        bool pilotTryRealModeFellBack = false,
        CancellationToken ct = default)
    {
        try
        {
            Gen.SeedFakeResultsResponse result = await _api.SeedFakeResultsAsync(runId, pilotTryRealModeFellBack, ct);
            SeedFakeResultsResponse? mapped = DeserializeRoundTrip<SeedFakeResultsResponse>(result);

            return new SeedFakeResultsResult(true, mapped?.ResultCount ?? 0, null);
        }
        catch (Gen.ArchLucidApiException ex)
        {
            return new SeedFakeResultsResult(false, 0, ResolveApiErrorMessage(ex), ex.StatusCode);
        }
        catch (HttpRequestException ex)
        {
            return new SeedFakeResultsResult(false, 0, $"Cannot connect to ArchLucid API: {ex.Message}");
        }
        catch (TaskCanceledException)
        {
            return new SeedFakeResultsResult(false, 0, "Request timed out.");
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
