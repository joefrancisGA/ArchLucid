using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Parses normalized <c>adf-pipeline-flows.json</c> companion rows.
/// </summary>
public static class AzureInventoryAdfPipelineFlowParser
{
    private const int MaxIdentifierLength = 512;

    private const int MaxNameLength = 260;

    public static bool TryParse(JsonElement element, out AzureInventoryAdfPipelineFlowRow? row, out string? errorMessage)
    {
        row = null;
        errorMessage = null;

        if (element.ValueKind is not JsonValueKind.Object)
        {
            errorMessage = "ADF pipeline flow row must be a JSON object.";

            return false;
        }

        string? factoryResourceId = TryReadBoundedString(element, "factoryResourceId", MaxIdentifierLength);
        string? pipelineResourceId = TryReadBoundedString(element, "pipelineResourceId", MaxIdentifierLength);
        string? pipelineName = TryReadBoundedString(element, "pipelineName", MaxNameLength);
        string? activityName = TryReadBoundedString(element, "activityName", MaxNameLength);
        string? activityType = TryReadBoundedString(element, "activityType", MaxNameLength);
        string? flowDirection = TryReadBoundedString(element, "flowDirection", MaxNameLength);
        string? datasetName = TryReadBoundedString(element, "datasetName", MaxNameLength);
        string? collectionStatus = TryReadBoundedString(element, "collectionStatus", MaxNameLength);

        if (string.IsNullOrWhiteSpace(factoryResourceId)
            || string.IsNullOrWhiteSpace(pipelineResourceId)
            || string.IsNullOrWhiteSpace(pipelineName)
            || string.IsNullOrWhiteSpace(activityName)
            || string.IsNullOrWhiteSpace(activityType)
            || string.IsNullOrWhiteSpace(flowDirection)
            || string.IsNullOrWhiteSpace(datasetName)
            || string.IsNullOrWhiteSpace(collectionStatus))
        {
            errorMessage = "factoryResourceId, pipelineResourceId, pipelineName, activityName, activityType, flowDirection, datasetName, and collectionStatus are required.";

            return false;
        }

        if (!AzureInventoryAdfLinkedServiceCollectionStatus.IsValid(collectionStatus))
        {
            errorMessage = $"Unsupported collectionStatus '{collectionStatus}'.";

            return false;
        }

        if (!flowDirection.Equals(AzureInventoryAdfPipelineFlowDirection.Read, StringComparison.OrdinalIgnoreCase)
            && !flowDirection.Equals(AzureInventoryAdfPipelineFlowDirection.Write, StringComparison.OrdinalIgnoreCase))
        {
            errorMessage = $"Unsupported flowDirection '{flowDirection}'.";

            return false;
        }

        row = new AzureInventoryAdfPipelineFlowRow
        {
            FactoryResourceId = factoryResourceId.Trim(),
            PipelineResourceId = pipelineResourceId.Trim(),
            PipelineName = pipelineName.Trim(),
            ActivityName = activityName.Trim(),
            ActivityType = activityType.Trim(),
            FlowDirection = flowDirection.Trim(),
            DatasetName = datasetName.Trim(),
            CollectionStatus = collectionStatus.Trim(),
            WarningCode = TryReadBoundedString(element, "warningCode", MaxNameLength),
        };

        return true;
    }

    private static string? TryReadBoundedString(JsonElement element, string propertyName, int maxLength)
    {
        string? value = TryReadString(element, propertyName);

        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        string trimmed = value.Trim();

        if (trimmed.Length > maxLength)
        {
            trimmed = trimmed[..maxLength];
        }

        return trimmed;
    }

    private static string? TryReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        return value.ValueKind is JsonValueKind.String ? value.GetString() : value.GetRawText().Trim('"');
    }
}
