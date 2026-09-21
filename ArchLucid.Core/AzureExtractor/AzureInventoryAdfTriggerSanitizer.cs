using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Converts ARM trigger payloads into normalized companion rows without secret-bearing fields.
/// </summary>
public static class AzureInventoryAdfTriggerSanitizer
{
    public static bool TrySanitizeFromArmResource(
        string factoryResourceId,
        JsonElement triggerResource,
        out AzureInventoryAdfTriggerRow? row)
    {
        row = null;

        if (string.IsNullOrWhiteSpace(factoryResourceId)
            || triggerResource.ValueKind is not JsonValueKind.Object)
        {
            return false;
        }

        string? triggerResourceId = TryReadString(triggerResource, "id");
        string? triggerName = TryReadString(triggerResource, "name");

        if (string.IsNullOrWhiteSpace(triggerResourceId) || string.IsNullOrWhiteSpace(triggerName))
        {
            return false;
        }

        if (!triggerResource.TryGetProperty("properties", out JsonElement propertiesElement)
            || propertiesElement.ValueKind is not JsonValueKind.Object)
        {
            return false;
        }

        string? triggerType = TryReadString(propertiesElement, "type");

        if (string.IsNullOrWhiteSpace(triggerType))
        {
            return false;
        }

        propertiesElement.TryGetProperty("typeProperties", out JsonElement typePropertiesElement);

        if (typePropertiesElement.ValueKind is not JsonValueKind.Object)
        {
            typePropertiesElement = default;
        }

        List<string> pipelineNames = ExtractPipelineNames(typePropertiesElement, triggerType);
        (string? sourceResourceId, string? sourceHost) = ExtractSource(typePropertiesElement, triggerType);
        string? scheduleRecurrence = ExtractScheduleRecurrence(typePropertiesElement, triggerType);

        row = new AzureInventoryAdfTriggerRow
        {
            FactoryResourceId = factoryResourceId.Trim(),
            TriggerResourceId = triggerResourceId.Trim(),
            TriggerName = triggerName.Trim(),
            TriggerType = triggerType.Trim(),
            PipelineNames = pipelineNames,
            SourceResourceId = sourceResourceId,
            SourceHost = sourceHost,
            ScheduleRecurrence = scheduleRecurrence,
            CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
        };

        return true;
    }

    private static List<string> ExtractPipelineNames(JsonElement typePropertiesElement, string triggerType)
    {
        List<string> pipelineNames = [];

        if (typePropertiesElement.ValueKind is not JsonValueKind.Object)
        {
            return pipelineNames;
        }

        if (typePropertiesElement.TryGetProperty("pipelines", out JsonElement pipelinesElement)
            && pipelinesElement.ValueKind is JsonValueKind.Array)
        {
            foreach (JsonElement pipeline in pipelinesElement.EnumerateArray())
            {
                string? referenceName = TryReadString(pipeline, "pipelineReference")
                                       ?? TryReadString(pipeline, "referenceName");

                if (AzureInventoryAdfStaticReferenceValidator.IsStaticReferenceName(referenceName))
                {
                    pipelineNames.Add(referenceName!.Trim());
                }
            }
        }

        string? singlePipeline = AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "pipeline");

        if (AzureInventoryAdfStaticReferenceValidator.IsStaticReferenceName(singlePipeline))
        {
            pipelineNames.Add(singlePipeline!.Trim());
        }

        return pipelineNames.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
    }

    private static (string? SourceResourceId, string? SourceHost) ExtractSource(
        JsonElement typePropertiesElement,
        string triggerType)
    {
        if (typePropertiesElement.ValueKind is not JsonValueKind.Object)
        {
            return (null, null);
        }

        if (triggerType.Equals("BlobEventsTrigger", StringComparison.OrdinalIgnoreCase)
            || triggerType.Equals("BlobTrigger", StringComparison.OrdinalIgnoreCase))
        {
            string? scope = AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "scope");

            if (IsArmResourceId(scope))
            {
                return (scope!.Trim(), null);
            }

            string? blobPath = AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "blobPath");

            if (!string.IsNullOrWhiteSpace(blobPath) && blobPath.Contains('/', StringComparison.Ordinal))
            {
                string hostCandidate = blobPath.Split('/')[0];

                if (!AzureInventoryAdfStaticReferenceValidator.IsStaticReferenceName(hostCandidate))
                {
                    return (null, null);
                }
            }
        }

        if (triggerType.Equals("AzureEventsTrigger", StringComparison.OrdinalIgnoreCase))
        {
            string? topic = AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "topic");

            if (IsArmResourceId(topic))
            {
                return (topic!.Trim(), null);
            }
        }

        return (null, null);
    }

    private static string? ExtractScheduleRecurrence(JsonElement typePropertiesElement, string triggerType)
    {
        if (!triggerType.Equals("ScheduleTrigger", StringComparison.OrdinalIgnoreCase)
            && !triggerType.Equals("TumblingWindowTrigger", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        if (typePropertiesElement.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        if (!typePropertiesElement.TryGetProperty("recurrence", out JsonElement recurrenceElement)
            || recurrenceElement.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        return AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(recurrenceElement, "frequency");
    }

    private static bool IsArmResourceId(string? value)
    {
        return !string.IsNullOrWhiteSpace(value)
               && value.TrimStart().StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase);
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
