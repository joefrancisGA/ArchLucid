using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Common;

using Gen = ArchLucid.Api.Client.Generated;

namespace ArchLucid.Cli;

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

    public async Task<bool> UpdateComparisonRecordAsync(
        string comparisonRecordId,
        string? label,
        IReadOnlyList<string>? tags,
        CancellationToken ct = default)
    {
        try
        {
            Gen.UpdateComparisonRecordRequest bodyModel = new() { Label = label, Tags = tags?.ToList() };
            Gen.Body35? body = MapToOpenApiRequestBody<Gen.Body35>(bodyModel, ContractEnumAwareJson);

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
