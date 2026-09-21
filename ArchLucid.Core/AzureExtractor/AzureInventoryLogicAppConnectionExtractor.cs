using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Extracts static Logic App connection references from ARM workflow payloads (AX-DE-12).
/// </summary>
public static class AzureInventoryLogicAppConnectionExtractor
{
    public static IReadOnlyList<AzureInventoryLogicAppConnectionRow> ExtractFromWorkflow(
        string workflowResourceId,
        string workflowName,
        JsonElement workflowResource)
    {
        List<AzureInventoryLogicAppConnectionRow> rows = [];

        if (string.IsNullOrWhiteSpace(workflowResourceId)
            || string.IsNullOrWhiteSpace(workflowName)
            || workflowResource.ValueKind is not JsonValueKind.Object)
        {
            return rows;
        }

        if (!workflowResource.TryGetProperty("properties", out JsonElement propertiesElement)
            || propertiesElement.ValueKind is not JsonValueKind.Object)
        {
            return rows;
        }

        if (propertiesElement.TryGetProperty("parameters", out JsonElement parametersElement)
            && parametersElement.ValueKind is JsonValueKind.Object
            && parametersElement.TryGetProperty("$connections", out JsonElement connectionsElement)
            && connectionsElement.ValueKind is JsonValueKind.Object)
        {
            foreach (JsonProperty connectionProperty in connectionsElement.EnumerateObject())
            {
                if (connectionProperty.Value.ValueKind is not JsonValueKind.Object)
                {
                    continue;
                }

                string? connectionResourceId = TryReadString(connectionProperty.Value, "connectionId")
                                               ?? TryReadString(connectionProperty.Value, "id");

                if (!AzureInventoryAdfStaticReferenceValidator.IsStaticReferenceName(connectionProperty.Name)
                    || string.IsNullOrWhiteSpace(connectionResourceId))
                {
                    continue;
                }

                rows.Add(new AzureInventoryLogicAppConnectionRow
                {
                    WorkflowResourceId = workflowResourceId.Trim(),
                    WorkflowName = workflowName.Trim(),
                    ConnectionName = connectionProperty.Name.Trim(),
                    ConnectionResourceId = connectionResourceId.Trim(),
                    CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
                });
            }
        }

        return rows;
    }

    public static AzureInventoryLogicAppConnectionRow? ExtractFromWebConnection(
        JsonElement connectionResource)
    {
        if (connectionResource.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        string? connectionResourceId = TryReadString(connectionResource, "id");
        string? connectionName = TryReadString(connectionResource, "name");

        if (string.IsNullOrWhiteSpace(connectionResourceId) || string.IsNullOrWhiteSpace(connectionName))
        {
            return null;
        }

        string? targetHost = null;

        if (connectionResource.TryGetProperty("properties", out JsonElement propertiesElement)
            && propertiesElement.ValueKind is JsonValueKind.Object)
        {
            string? apiId = TryReadString(propertiesElement, "apiId");

            if (!string.IsNullOrWhiteSpace(apiId))
            {
                targetHost = AzureInventoryEventGridWebhookHostExtractor.TryExtractHost(apiId);
            }
        }

        return new AzureInventoryLogicAppConnectionRow
        {
            WorkflowResourceId = connectionResourceId.Trim(),
            WorkflowName = connectionName.Trim(),
            ConnectionName = connectionName.Trim(),
            ConnectionResourceId = connectionResourceId.Trim(),
            TargetHost = targetHost,
            CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
        };
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
