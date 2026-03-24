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
        ArgumentNullException.ThrowIfNull(record);

        if (string.IsNullOrWhiteSpace(record.AnalysisRequestJson))
            return null;

        try
        {
            return JsonSerializer.Deserialize<PersistedAnalysisExportRequest>(
                record.AnalysisRequestJson,
                JsonOptions);
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException(
                $"Export record '{record.ExportRecordId}' AnalysisRequestJson could not be deserialized. " +
                "The stored JSON may be corrupt or written by an incompatible schema version.", ex);
        }
    }
}

