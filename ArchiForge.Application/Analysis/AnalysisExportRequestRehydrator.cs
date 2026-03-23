using System.Text.Json;

using ArchiForge.Contracts.Metadata;

namespace ArchiForge.Application.Analysis;

public static class AnalysisExportRequestRehydrator
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    public static PersistedAnalysisExportRequest? Rehydrate(RunExportRecord record)
    {
        if (string.IsNullOrWhiteSpace(record.AnalysisRequestJson))
        {
            return null;
        }

        return JsonSerializer.Deserialize<PersistedAnalysisExportRequest>(
            record.AnalysisRequestJson,
            JsonOptions);
    }
}

