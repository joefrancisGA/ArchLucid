using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Extracts static Logic App connection references from ARM workflow payloads (AX-DE-12).
/// </summary>
public static class AzureInventoryLogicAppConnectionExtractor
{
    private static readonly string[] AllowedActionResourceProviders =
    [
        "microsoft.datafactory/factories",
        "microsoft.synapse/workspaces",
        "microsoft.storage/storageaccounts",
        "microsoft.web/sites",
        "microsoft.servicebus/namespaces",
        "microsoft.eventhub/namespaces",
        "microsoft.sql/servers",
        "microsoft.documentdb/databaseaccounts",
    ];

    private static readonly string[] SensitivePropertyFragments =
    [
        "password",
        "secret",
        "connectionstring",
        "securedata",
        "accesskey",
        "accountkey",
        "token",
        "sas",
        "authentication",
    ];

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
            // ARM stores Consumption connections as parameters.$connections.value.{name}.
            JsonElement connectionsObject = connectionsElement;

            if (connectionsElement.TryGetProperty("value", out JsonElement valueElement)
                && valueElement.ValueKind is JsonValueKind.Object)
            {
                connectionsObject = valueElement;
            }

            foreach (JsonProperty connectionProperty in connectionsObject.EnumerateObject())
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

        HashSet<string> connectionResourceIds = rows
            .Select(row => row.ConnectionResourceId)
            .Where(connectionResourceId => !string.IsNullOrWhiteSpace(connectionResourceId))
            .Select(connectionResourceId => connectionResourceId!.Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (propertiesElement.TryGetProperty("definition", out JsonElement definitionElement)
            && definitionElement.ValueKind is JsonValueKind.Object
            && definitionElement.TryGetProperty("actions", out JsonElement actionsElement)
            && actionsElement.ValueKind is JsonValueKind.Object)
        {
            ExtractActionConnections(
                workflowResourceId.Trim(),
                workflowName.Trim(),
                actionsElement,
                connectionResourceIds,
                rows);
        }

        return rows;
    }

    public static IReadOnlyList<AzureInventoryLogicAppConnectionRow> ExtractFromStoredConnectionParameters(
        string workflowResourceId,
        string workflowName,
        string connectionsValueJson)
    {
        if (string.IsNullOrWhiteSpace(workflowResourceId)
            || string.IsNullOrWhiteSpace(workflowName)
            || string.IsNullOrWhiteSpace(connectionsValueJson))
        {
            return [];
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(connectionsValueJson);
            return ExtractFromConnectionsObject(workflowResourceId, workflowName, document.RootElement);
        }
        catch (JsonException)
        {
            return [];
        }
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

    private static IReadOnlyList<AzureInventoryLogicAppConnectionRow> ExtractFromConnectionsObject(
        string workflowResourceId,
        string workflowName,
        JsonElement connectionsObject)
    {
        List<AzureInventoryLogicAppConnectionRow> rows = [];

        if (connectionsObject.ValueKind is not JsonValueKind.Object)
        {
            return rows;
        }

        foreach (JsonProperty connectionProperty in connectionsObject.EnumerateObject())
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

        return rows;
    }

    private static string? TryReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        return value.ValueKind is JsonValueKind.String ? value.GetString() : value.GetRawText().Trim('"');
    }

    private static void ExtractActionConnections(
        string workflowResourceId,
        string workflowName,
        JsonElement actionsElement,
        HashSet<string> connectionResourceIds,
        List<AzureInventoryLogicAppConnectionRow> rows)
    {
        foreach (JsonProperty actionProperty in actionsElement.EnumerateObject())
        {
            if (actionProperty.Value.ValueKind is not JsonValueKind.Object)
            {
                continue;
            }

            ExtractActionConnectionValues(
                workflowResourceId,
                workflowName,
                actionProperty.Name,
                actionProperty.Value,
                connectionResourceIds,
                rows);
        }
    }

    private static void ExtractActionConnectionValues(
        string workflowResourceId,
        string workflowName,
        string actionName,
        JsonElement actionElement,
        HashSet<string> connectionResourceIds,
        List<AzureInventoryLogicAppConnectionRow> rows)
    {
        foreach (JsonProperty property in actionElement.EnumerateObject())
        {
            if (IsSensitiveProperty(property.Name))
            {
                continue;
            }

            if (property.Name.Equals("actions", StringComparison.OrdinalIgnoreCase)
                && property.Value.ValueKind is JsonValueKind.Object)
            {
                ExtractActionConnections(
                    workflowResourceId,
                    workflowName,
                    property.Value,
                    connectionResourceIds,
                    rows);

                continue;
            }

            if (property.Value.ValueKind is JsonValueKind.String)
            {
                string? resourceId = TryReadAllowedResourceId(property.Value.GetString(), workflowResourceId);

                if (!string.IsNullOrWhiteSpace(resourceId)
                    && connectionResourceIds.Add(resourceId))
                {
                    rows.Add(new AzureInventoryLogicAppConnectionRow
                    {
                        WorkflowResourceId = workflowResourceId,
                        WorkflowName = workflowName,
                        ConnectionName = actionName,
                        ConnectionResourceId = resourceId,
                        CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
                    });
                }

                continue;
            }

            if (property.Value.ValueKind is JsonValueKind.Object)
            {
                ExtractActionConnectionValues(
                    workflowResourceId,
                    workflowName,
                    actionName,
                    property.Value,
                    connectionResourceIds,
                    rows);
            }
            else if (property.Value.ValueKind is JsonValueKind.Array)
            {
                foreach (JsonElement item in property.Value.EnumerateArray())
                {
                    if (item.ValueKind is JsonValueKind.Object)
                    {
                        ExtractActionConnectionValues(
                            workflowResourceId,
                            workflowName,
                            actionName,
                            item,
                            connectionResourceIds,
                            rows);
                    }
                }
            }
        }
    }

    private static bool IsSensitiveProperty(string propertyName)
    {
        string normalizedName = propertyName.Replace("_", string.Empty, StringComparison.Ordinal)
            .Replace("-", string.Empty, StringComparison.Ordinal)
            .ToLowerInvariant();

        return SensitivePropertyFragments.Any(normalizedName.Contains);
    }

    private static string? TryReadAllowedResourceId(string? value, string workflowResourceId)
    {
        if (string.IsNullOrWhiteSpace(value)
            || value.Contains('@', StringComparison.Ordinal))
        {
            return null;
        }

        string candidate = value.Trim();
        if (!candidate.StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase)
            || candidate.Equals(workflowResourceId, StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        string[] segments = candidate.Split('/', StringSplitOptions.RemoveEmptyEntries);
        int providerIndex = Array.FindIndex(
            segments,
            segment => segment.Equals("providers", StringComparison.OrdinalIgnoreCase));

        if (providerIndex < 0 || providerIndex + 2 >= segments.Length)
        {
            return null;
        }

        string providerAndType =
            $"{segments[providerIndex + 1]}/{segments[providerIndex + 2]}".ToLowerInvariant();

        return AllowedActionResourceProviders.Contains(providerAndType, StringComparer.OrdinalIgnoreCase)
            ? candidate
            : null;
    }
}
