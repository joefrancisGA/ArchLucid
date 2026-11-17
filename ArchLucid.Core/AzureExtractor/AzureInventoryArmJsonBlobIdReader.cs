using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Reads ARM resource ids from JSON blob scalars on inventory companion and flattened property bags.
/// </summary>
public static class AzureInventoryArmJsonBlobIdReader
{
    public static string? TryReadArmIdFromJson(string json, Func<string?, string?>? reResolve = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(json);

        try
        {
            using JsonDocument document = JsonDocument.Parse(json);
            JsonElement root = document.RootElement;

            if (root.ValueKind is not JsonValueKind.Object)
            {
                return null;
            }

            string? armId = AzureInventoryArmNestedObjectPropertyReader.TryReadScalarString(root);

            if (string.IsNullOrWhiteSpace(armId))
            {
                return null;
            }

            if (reResolve is null)
            {
                return armId;
            }

            string? resolved = reResolve(armId);

            return resolved ?? armId;
        }
        catch (JsonException)
        {
            return null;
        }
    }
}