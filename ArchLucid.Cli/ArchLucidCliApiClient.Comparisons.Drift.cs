using System.Text.Json;

using ArchLucid.Core.AgentEvaluation;

using Gen = ArchLucid.Api.Client.Generated;

namespace ArchLucid.Cli;

public sealed partial class ArchLucidApiClient
{
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
}
