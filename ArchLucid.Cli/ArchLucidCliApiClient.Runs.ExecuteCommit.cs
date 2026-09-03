using System.Net;

using Gen = ArchLucid.Api.Client.Generated;

namespace ArchLucid.Cli;

/// <summary>
///     Architecture run execute and commit lifecycle.
/// </summary>
public sealed partial class ArchLucidApiClient
{
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
}
