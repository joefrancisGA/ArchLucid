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
///     Comparison search, replay, drift, and diagnostics calls. Binary replay/zip exports use raw
///     <see cref="HttpClient" /> because the OpenAPI model returns <c>FileContentResult</c> JSON.
/// </summary>
public sealed partial class ArchLucidApiClient
{
    public async Task<ComparisonHistoryResult?> SearchComparisonsAsync(
        string? comparisonType,
        string? leftRunId,
        string? rightRunId,
        string? leftExportRecordId,
        string? rightExportRecordId,
        string? label,
        string? tag,
        string? tags,
        string? sortBy,
        string? sortDir,
        string? cursor = "",
        int skip = 0,
        int limit = 20,
        CancellationToken ct = default)
    {
        try
        {
            string[]? tagsArray = string.IsNullOrWhiteSpace(tags)
                ? null
                : tags.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            // Null would omit the query key in some generated clients; empty string forces keyset paging.
            string cursorQuery = cursor ?? "";

            Gen.ComparisonHistoryResponse history = await _api.ComparisonsGETAsync(
                comparisonType,
                leftRunId,
                rightRunId,
                leftExportRecordId,
                rightExportRecordId,
                label,
                null,
                null,
                tag,
                tagsArray,
                sortBy,
                sortDir,
                cursorQuery,
                skip,
                limit,
                ct);

            return DeserializeRoundTrip<ComparisonHistoryResult>(history);
        }
        catch (Exception ex)
        {
            LogCliFailure("GetComparisonHistory", ex);

            return null;
        }
    }

    public async Task<bool> ReplayComparisonToFileAsync(
        string comparisonRecordId,
        string format,
        string replayMode,
        string? profile,
        bool persistReplay,
        string? outPath,
        bool force,
        CancellationToken ct = default)
    {
        try
        {
            string uri =
                $"/v1/architecture/comparisons/{Uri.EscapeDataString(comparisonRecordId)}/replay?format={Uri.EscapeDataString(format)}";
            var body = new { format, replayMode, profile, persistReplay };

            HttpResponseMessage response = await _http.PostAsJsonAsync(uri, body, _jsonOptions, ct);

            if (!response.IsSuccessStatusCode)
            {
                string contentError = await response.Content.ReadAsStringAsync(ct);
                Console.WriteLine($"Replay failed ({(int)response.StatusCode}): {contentError}");

                return false;
            }

            if (response.Headers.TryGetValues("X-ArchLucid-PersistedReplayRecordId",
                    out IEnumerable<string>? persistedValues))
            {
                string? persistedId = persistedValues.FirstOrDefault();

                if (!string.IsNullOrWhiteSpace(persistedId))

                    Console.WriteLine($"PersistedReplayRecordId: {persistedId}");
            }

            string fileName = response.Content.Headers.ContentDisposition?.FileNameStar
                              ?? response.Content.Headers.ContentDisposition?.FileName
                              ?? $"comparison_{comparisonRecordId}.{format}";
            fileName = fileName.Trim('"');

            string targetPath = fileName;

            if (!string.IsNullOrWhiteSpace(outPath))

                if (Directory.Exists(outPath) || outPath.EndsWith(Path.DirectorySeparatorChar) ||
                    outPath.EndsWith(Path.AltDirectorySeparatorChar))
                {
                    Directory.CreateDirectory(outPath.TrimEnd(Path.DirectorySeparatorChar,
                        Path.AltDirectorySeparatorChar));
                    targetPath = Path.Combine(outPath, fileName);
                }
                else
                {
                    string? dir = Path.GetDirectoryName(outPath);

                    if (!string.IsNullOrWhiteSpace(dir))

                        Directory.CreateDirectory(dir);

                    targetPath = outPath;
                }

            if (File.Exists(targetPath) && !force)
            {
                Console.WriteLine($"Refusing to overwrite existing file: {targetPath}");
                Console.WriteLine("Re-run with --force to overwrite, or choose a different --out path.");

                return false;
            }

            byte[] bytes = await response.Content.ReadAsByteArrayAsync(ct);
            await File.WriteAllBytesAsync(targetPath, bytes, ct);
            Console.WriteLine($"Replay exported to {targetPath}");

            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Replay failed: {ex.Message}");

            return false;
        }
    }

    public async Task<string?> GetComparisonDriftJsonAsync(string comparisonRecordId, CancellationToken ct = default)
    {
        try
        {
            Gen.DriftAnalysisResponse drift = await _api.DriftAsync(comparisonRecordId, ct);

            return JsonSerializer.Serialize(drift, _jsonOptions);
        }
        catch
        {
            return null;
        }
    }

    public async Task<string?> GetReplayDiagnosticsJsonAsync(int maxCount = 50, CancellationToken ct = default)
    {
        try
        {
            int safe = Math.Clamp(maxCount, 1, 100);
            Gen.ReplayDiagnosticsResponse diag = await _api.ReplayGETAsync(safe, ct);

            return JsonSerializer.Serialize(diag, _jsonOptions);
        }
        catch (Exception ex)
        {
            LogCliFailure("GetReplayDiagnosticsJson", ex);

            return null;
        }
    }

    public async Task<ComparisonSummary?> GetComparisonSummaryAsync(string comparisonRecordId,
        CancellationToken ct = default)
    {
        try
        {
            Gen.ComparisonSummaryResponse summary = await _api.SummaryGET2Async(comparisonRecordId, ct);

            return DeserializeRoundTrip<ComparisonSummary>(summary);
        }
        catch (Exception ex)
        {
            LogCliFailure($"GetComparisonSummary({comparisonRecordId})", ex);

            return null;
        }
    }

    public async Task<bool> ReplayComparisonsBatchToZipAsync(
        IReadOnlyList<string> comparisonRecordIds,
        string format,
        string replayMode,
        string? profile,
        bool persistReplay,
        string? outPath,
        bool force,
        CancellationToken ct = default)
    {
        try
        {
            const string uri = "/v1/architecture/comparisons/replay/batch";
            var body = new
            {
                comparisonRecordIds,
                format,
                replayMode,
                profile,
                persistReplay
            };

            HttpResponseMessage response = await _http.PostAsJsonAsync(uri, body, _jsonOptions, ct);

            if (!response.IsSuccessStatusCode)
            {
                string contentError = await response.Content.ReadAsStringAsync(ct);
                Console.WriteLine($"Batch replay failed ({(int)response.StatusCode}): {contentError}");

                return false;
            }

            string fileName = response.Content.Headers.ContentDisposition?.FileNameStar
                              ?? response.Content.Headers.ContentDisposition?.FileName
                              ?? "comparison_replays.zip";
            fileName = fileName.Trim('"');

            string targetPath = fileName;

            if (!string.IsNullOrWhiteSpace(outPath))

                if (Directory.Exists(outPath) || outPath.EndsWith(Path.DirectorySeparatorChar) ||
                    outPath.EndsWith(Path.AltDirectorySeparatorChar))
                {
                    Directory.CreateDirectory(outPath.TrimEnd(Path.DirectorySeparatorChar,
                        Path.AltDirectorySeparatorChar));
                    targetPath = Path.Combine(outPath, fileName);
                }
                else
                {
                    string? dir = Path.GetDirectoryName(outPath);

                    if (!string.IsNullOrWhiteSpace(dir))

                        Directory.CreateDirectory(dir);

                    targetPath = outPath;
                }

            if (File.Exists(targetPath) && !force)
            {
                Console.WriteLine($"Refusing to overwrite existing file: {targetPath}");
                Console.WriteLine("Re-run with --force to overwrite, or choose a different --out path.");

                return false;
            }

            byte[] bytes = await response.Content.ReadAsByteArrayAsync(ct);
            await File.WriteAllBytesAsync(targetPath, bytes, ct);
            Console.WriteLine($"Batch replay exported to {targetPath}");

            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Batch replay failed: {ex.Message}");

            return false;
        }
    }

    public async Task<DriftAnalysis?> GetComparisonDriftAsync(string comparisonRecordId, CancellationToken ct = default)
    {
        try
        {
            Gen.DriftAnalysisResponse drift = await _api.DriftAsync(comparisonRecordId, ct);

            return DeserializeRoundTrip<DriftAnalysis>(drift);
        }
        catch (Exception ex)
        {
            LogCliFailure($"GetComparisonDrift({comparisonRecordId})", ex);

            return null;
        }
    }

    public async Task<ReplayDiagnostics?> GetReplayDiagnosticsAsync(int maxCount, CancellationToken ct = default)
    {
        try
        {
            Gen.ReplayDiagnosticsResponse diag = await _api.ReplayGETAsync(maxCount, ct);

            return DeserializeRoundTrip<ReplayDiagnostics>(diag);
        }
        catch (Exception ex)
        {
            LogCliFailure("GetReplayDiagnostics", ex);

            return null;
        }
    }

    public async Task<bool> UpdateComparisonRecordAsync(
        string comparisonRecordId,
        string? label,
        IReadOnlyList<string>? tags,
        CancellationToken ct = default)
    {
        try
        {
            Gen.UpdateComparisonRecordRequest bodyModel = new() { Label = label, Tags = tags?.ToList() };
            Gen.Body32? body = MapToOpenApiRequestBody<Gen.Body32>(bodyModel, ContractEnumAwareJson);

            await _api.ComparisonsPATCHAsync(comparisonRecordId, body, ct);

            return true;
        }
        catch (Exception ex)
        {
            LogCliFailure($"UpdateComparisonRecord({comparisonRecordId})", ex);

            return false;
        }
    }
}
