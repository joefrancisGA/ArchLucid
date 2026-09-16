using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Extracts declared pipeline activity input/output dataset flows from sanitized ARM pipeline payloads.
/// </summary>
public static class AzureInventoryAdfPipelineFlowExtractor
{
    public const int DefaultMaxNestedPipelineDepth = 3;

    public static IReadOnlyList<AzureInventoryAdfPipelineFlowRow> ExtractFlows(
        string factoryResourceId,
        IReadOnlyList<JsonElement> pipelineResources,
        int maxNestedPipelineDepth = DefaultMaxNestedPipelineDepth)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(factoryResourceId);
        ArgumentNullException.ThrowIfNull(pipelineResources);

        if (maxNestedPipelineDepth < 0)
        {
            maxNestedPipelineDepth = 0;
        }

        Dictionary<string, JsonElement> pipelinesByName = BuildPipelineIndex(pipelineResources);
        List<AzureInventoryAdfPipelineFlowRow> flows = [];
        HashSet<string> flowKeys = new(StringComparer.OrdinalIgnoreCase);

        foreach (JsonElement pipelineResource in pipelineResources)
        {
            if (!TryReadPipelineIdentity(pipelineResource, out string? pipelineResourceId, out string? pipelineName))
            {
                continue;
            }

            ExtractActivities(
                factoryResourceId,
                pipelineResourceId!,
                pipelineName!,
                pipelineResource,
                pipelinesByName,
                maxNestedPipelineDepth,
                [],
                flows,
                flowKeys);
        }

        return flows;
    }

    private static Dictionary<string, JsonElement> BuildPipelineIndex(IReadOnlyList<JsonElement> pipelineResources)
    {
        Dictionary<string, JsonElement> pipelinesByName = new(StringComparer.OrdinalIgnoreCase);

        foreach (JsonElement pipelineResource in pipelineResources)
        {
            string? pipelineName = TryReadString(pipelineResource, "name");

            if (string.IsNullOrWhiteSpace(pipelineName))
            {
                continue;
            }

            pipelinesByName[pipelineName.Trim()] = pipelineResource;
        }

        return pipelinesByName;
    }

    private static void ExtractActivities(
        string factoryResourceId,
        string pipelineResourceId,
        string pipelineName,
        JsonElement pipelineResource,
        IReadOnlyDictionary<string, JsonElement> pipelinesByName,
        int remainingNestedDepth,
        HashSet<string> pipelineVisitStack,
        List<AzureInventoryAdfPipelineFlowRow> flows,
        HashSet<string> flowKeys)
    {
        if (!pipelineResource.TryGetProperty("properties", out JsonElement propertiesElement)
            || propertiesElement.ValueKind is not JsonValueKind.Object
            || !propertiesElement.TryGetProperty("activities", out JsonElement activitiesElement)
            || activitiesElement.ValueKind is not JsonValueKind.Array)
        {
            return;
        }

        foreach (JsonElement activity in activitiesElement.EnumerateArray())
        {
            if (activity.ValueKind is not JsonValueKind.Object)
            {
                continue;
            }

            string? activityName = TryReadString(activity, "name");
            string? activityType = TryReadString(activity, "type");

            if (string.IsNullOrWhiteSpace(activityName) || string.IsNullOrWhiteSpace(activityType))
            {
                continue;
            }

            if (activityType.Equals("ExecutePipeline", StringComparison.OrdinalIgnoreCase))
            {
                TryExpandExecutePipeline(
                    factoryResourceId,
                    pipelineResourceId,
                    pipelineName,
                    activity,
                    pipelinesByName,
                    remainingNestedDepth,
                    pipelineVisitStack,
                    flows,
                    flowKeys);

                continue;
            }

            AddDatasetReferences(
                factoryResourceId,
                pipelineResourceId,
                pipelineName,
                activityName,
                activityType,
                activity,
                "inputs",
                AzureInventoryAdfPipelineFlowDirection.Read,
                flows,
                flowKeys);

            AddDatasetReferences(
                factoryResourceId,
                pipelineResourceId,
                pipelineName,
                activityName,
                activityType,
                activity,
                "outputs",
                AzureInventoryAdfPipelineFlowDirection.Write,
                flows,
                flowKeys);
        }
    }

    private static void TryExpandExecutePipeline(
        string factoryResourceId,
        string pipelineResourceId,
        string pipelineName,
        JsonElement executePipelineActivity,
        IReadOnlyDictionary<string, JsonElement> pipelinesByName,
        int remainingNestedDepth,
        HashSet<string> pipelineVisitStack,
        List<AzureInventoryAdfPipelineFlowRow> flows,
        HashSet<string> flowKeys)
    {
        if (remainingNestedDepth <= 0)
        {
            return;
        }

        if (!executePipelineActivity.TryGetProperty("typeProperties", out JsonElement typePropertiesElement)
            || typePropertiesElement.ValueKind is not JsonValueKind.Object
            || !typePropertiesElement.TryGetProperty("pipeline", out JsonElement nestedPipelineElement)
            || nestedPipelineElement.ValueKind is not JsonValueKind.Object)
        {
            return;
        }

        string? nestedPipelineName = TryReadString(nestedPipelineElement, "referenceName");

        if (!AzureInventoryAdfStaticReferenceValidator.IsStaticReferenceName(nestedPipelineName)
            || !pipelinesByName.TryGetValue(nestedPipelineName!.Trim(), out JsonElement nestedPipelineResource))
        {
            return;
        }

        if (!TryReadPipelineIdentity(nestedPipelineResource, out string? nestedPipelineResourceId, out _))
        {
            return;
        }

        if (!pipelineVisitStack.Add(nestedPipelineName!.Trim()))
        {
            return;
        }

        ExtractActivities(
            factoryResourceId,
            nestedPipelineResourceId!,
            nestedPipelineName!.Trim(),
            nestedPipelineResource,
            pipelinesByName,
            remainingNestedDepth - 1,
            pipelineVisitStack,
            flows,
            flowKeys);

        pipelineVisitStack.Remove(nestedPipelineName!.Trim());
    }

    private static void AddDatasetReferences(
        string factoryResourceId,
        string pipelineResourceId,
        string pipelineName,
        string activityName,
        string activityType,
        JsonElement activity,
        string propertyName,
        string flowDirection,
        List<AzureInventoryAdfPipelineFlowRow> flows,
        HashSet<string> flowKeys)
    {
        if (!activity.TryGetProperty(propertyName, out JsonElement referencesElement)
            || referencesElement.ValueKind is not JsonValueKind.Array)
        {
            return;
        }

        foreach (JsonElement reference in referencesElement.EnumerateArray())
        {
            if (reference.ValueKind is not JsonValueKind.Object)
            {
                continue;
            }

            if (reference.TryGetProperty("type", out JsonElement referenceTypeElement)
                && referenceTypeElement.ValueKind is JsonValueKind.String
                && referenceTypeElement.GetString()?.Contains("Expression", StringComparison.OrdinalIgnoreCase) == true)
            {
                continue;
            }

            if (reference.TryGetProperty("parameters", out JsonElement parametersElement)
                && parametersElement.ValueKind is JsonValueKind.Object
                && parametersElement.EnumerateObject().Any())
            {
                continue;
            }

            string? datasetName = TryReadString(reference, "referenceName");

            if (!AzureInventoryAdfStaticReferenceValidator.IsStaticReferenceName(datasetName))
            {
                continue;
            }

            string flowKey =
                $"{factoryResourceId}|{pipelineResourceId}|{activityName}|{flowDirection}|{datasetName}";

            if (!flowKeys.Add(flowKey))
            {
                continue;
            }

            flows.Add(new AzureInventoryAdfPipelineFlowRow
            {
                FactoryResourceId = factoryResourceId.Trim(),
                PipelineResourceId = pipelineResourceId.Trim(),
                PipelineName = pipelineName.Trim(),
                ActivityName = activityName.Trim(),
                ActivityType = activityType.Trim(),
                FlowDirection = flowDirection,
                DatasetName = datasetName!.Trim(),
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
            });
        }
    }

    private static bool TryReadPipelineIdentity(
        JsonElement pipelineResource,
        out string? pipelineResourceId,
        out string? pipelineName)
    {
        pipelineResourceId = TryReadString(pipelineResource, "id");
        pipelineName = TryReadString(pipelineResource, "name");

        return !string.IsNullOrWhiteSpace(pipelineResourceId) && !string.IsNullOrWhiteSpace(pipelineName);
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
