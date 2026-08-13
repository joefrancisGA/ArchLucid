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
///     Version, health, and bounded-body probe calls used by <c>archlucid doctor</c> and status commands.
/// </summary>
public sealed partial class ArchLucidApiClient
{
    /// <summary>
    ///     Calls <c>GET /version</c> and returns the raw JSON body for operator diagnostics.
    /// </summary>
    public async Task<string?> GetVersionJsonAsync(CancellationToken ct = default)
    {
        try
        {
            using HttpResponseMessage response = await _http.GetAsync("/version", ct).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
                return null;

            return await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            LogCliFailure("GET /version", ex);

            return null;
        }
    }

    /// <summary>
    ///     Check connectivity to the ArchLucid API (GET /health/live). Returns true if the API process responds successfully
    ///     (liveness only).
    /// </summary>
    public async Task<bool> CheckHealthAsync(CancellationToken ct = default)
    {
        try
        {
            HttpResponseMessage response = await _http.GetAsync("/health/live", ct);

            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            LogCliFailure("Health check", ex);

            return false;
        }
    }

    /// <summary>
    ///     GET a health path (e.g. <c>/health/ready</c>) and return HTTP status plus response body for operator diagnostics.
    /// </summary>
    public async Task<(int StatusCode, string Body)> GetHealthProbeAsync(string path, CancellationToken ct = default)
    {
        string normalized = path.StartsWith("/", StringComparison.Ordinal) ? path : "/" + path;

        try
        {
            HttpResponseMessage response = await _http.GetAsync(normalized, ct);
            string body = await response.Content.ReadAsStringAsync(ct);

            return ((int)response.StatusCode, body);
        }
        catch (Exception ex)
        {
            LogCliFailure($"GET {normalized}", ex);

            return (0, ex.Message);
        }
    }

    /// <summary>
    ///     GET a path and capture at most <paramref name="maxBytes" /> of the UTF-8 body (for compact support-bundle probes).
    /// </summary>
    public async Task<(int StatusCode, string BodyPreview, bool BodyTruncated)> GetBoundedUtf8BodyAsync(
        string relativePath,
        int maxBytes,
        CancellationToken ct = default)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(maxBytes, 1);

        string normalized = relativePath.StartsWith("/", StringComparison.Ordinal)
            ? relativePath
            : "/" + relativePath;

        try
        {
            using HttpResponseMessage response =
                await _http.GetAsync(normalized, HttpCompletionOption.ResponseHeadersRead, ct);
            int code = (int)response.StatusCode;
            await using Stream stream = await response.Content.ReadAsStreamAsync(ct);
            using MemoryStream accumulator = new();

            byte[] buffer = new byte[8192];

            while (accumulator.Length < maxBytes + 1)
            {
                int toRead = (int)Math.Min(buffer.Length, maxBytes + 1 - accumulator.Length);

                if (toRead <= 0)
                    break;

                int n = await stream.ReadAsync(buffer.AsMemory(0, toRead), ct);

                if (n == 0)
                    break;

                accumulator.Write(buffer, 0, n);
            }

            byte[] all = accumulator.ToArray();
            bool truncated = all.Length > maxBytes;
            int useLen = truncated ? maxBytes : all.Length;
            string text = Encoding.UTF8.GetString(all, 0, useLen);

            return (code, text, truncated);
        }
        catch (Exception ex)
        {
            LogCliFailure($"GET {normalized} (bounded)", ex);

            return (0, ex.GetType().Name + ": " + ex.Message, false);
        }
    }
}
