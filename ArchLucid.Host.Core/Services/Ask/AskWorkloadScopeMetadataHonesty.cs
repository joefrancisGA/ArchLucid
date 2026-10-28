using System.Text.Json;

namespace ArchLucid.Host.Core.Services.Ask;

internal static class AskWorkloadScopeMetadataHonesty
{
    internal const string ScopeMetadataAbsentNote =
        "Workload scope metadata note: required capabilities, topology hints, and constraints were not stored in structured context. Expectation engines use their legacy defaults until scope metadata is collected on the review.";

    internal static string? BuildPromptNote(string contextJson)
    {
        if (string.IsNullOrWhiteSpace(contextJson))
        {
            return ScopeMetadataAbsentNote;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(contextJson);

            if (!document.RootElement.TryGetProperty("contextSnapshot", out JsonElement snapshot))
            {
                return ScopeMetadataAbsentNote;
            }

            if (HasAnyScopeMetadata(snapshot))
            {
                return null;
            }

            return ScopeMetadataAbsentNote;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static bool HasAnyScopeMetadata(JsonElement snapshot)
    {
        return HasNonEmptyString(snapshot, "requiredCapabilities")
            || HasNonEmptyString(snapshot, "topologyHints")
            || HasNonEmptyString(snapshot, "constraints");
    }

    private static bool HasNonEmptyString(JsonElement snapshot, string propertyName)
    {
        if (!snapshot.TryGetProperty(propertyName, out JsonElement value))
        {
            return false;
        }

        return value.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(value.GetString());
    }
}
