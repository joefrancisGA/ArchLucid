using System.IO.Compression;
using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>Reads schema v1/v2 inventory payloads from Azure extractor ZIP archives.</summary>
public static class AzureExtractorPackageInventoryReader
{
    private static readonly JsonSerializerOptions SerializerOptions =
        new() { PropertyNameCaseInsensitive = true };

    public static AzureExtractorPackageInventoryReadResult TryReadFromZip(Stream zipStream)
    {
        ArgumentNullException.ThrowIfNull(zipStream);

        try
        {
            using ZipArchive archive = new(zipStream, ZipArchiveMode.Read, leaveOpen: true);

            List<AzureExtractorExtendedResourceRow> resources = ReadResources(archive);
            List<JsonElement> roleAssignments = ReadOptionalArray(archive, AzureExtractorPackageZipEntryNames.RoleAssignments);
            List<JsonElement> diagnosticSettings = ReadOptionalArray(archive, AzureExtractorPackageZipEntryNames.DiagnosticSettings);
            List<JsonElement> networkAssociations = ReadOptionalArray(archive, AzureExtractorPackageZipEntryNames.NetworkAssociations);
            List<JsonElement> policyAssignments = ReadOptionalArray(archive, AzureExtractorPackageZipEntryNames.PolicyAssignments);
            (bool federatedCredentialsFilePresent, List<AzureInventoryFederatedCredentialRow> federatedCredentials) =
                ReadFederatedCredentials(archive);
            (bool entraGroupMembershipsFilePresent, List<AzureInventoryEntraGroupMembershipRow> entraGroupMemberships) =
                ReadEntraGroupMemberships(archive);
            List<JsonElement> defenderSummary = ReadOptionalArray(archive, AzureExtractorPackageZipEntryNames.DefenderSummary);
            (bool effectiveNetworkControlsFilePresent, List<AzureInventoryEffectiveNetworkControlRow> effectiveNetworkControls) =
                ReadEffectiveNetworkControls(archive);
            (bool adfLinkedServicesFilePresent, List<AzureInventoryAdfLinkedServiceRow> adfLinkedServices) =
                ReadAdfLinkedServices(archive);
            (bool adfDatasetsFilePresent, List<AzureInventoryAdfDatasetRow> adfDatasets) =
                ReadAdfDatasets(archive);
            (bool adfPipelineFlowsFilePresent, List<AzureInventoryAdfPipelineFlowRow> adfPipelineFlows) =
                ReadAdfPipelineFlows(archive);
            (bool adfTriggersFilePresent, List<AzureInventoryAdfTriggerRow> adfTriggers) =
                ReadAdfTriggers(archive);
            (bool adfIntegrationRuntimesFilePresent, List<AzureInventoryAdfIntegrationRuntimeRow> adfIntegrationRuntimes) =
                ReadAdfIntegrationRuntimes(archive);
            (bool adfDataflowsFilePresent, List<AzureInventoryAdfDataflowRow> adfDataflows) =
                ReadAdfDataflows(archive);
            (bool eventGridSubscriptionsFilePresent, List<AzureInventoryEventGridSubscriptionRow> eventGridSubscriptions) =
                ReadEventGridSubscriptions(archive);
            (bool logicAppConnectionsFilePresent, List<AzureInventoryLogicAppConnectionRow> logicAppConnections) =
                ReadLogicAppConnections(archive);
            (bool messagingAssociationsFilePresent, List<AzureInventoryMessagingAssociationRow> messagingAssociations) =
                ReadMessagingAssociations(archive);

            return new AzureExtractorPackageInventoryReadResult
            {
                Resources = resources,
                RoleAssignments = roleAssignments,
                DiagnosticSettings = diagnosticSettings,
                NetworkAssociations = networkAssociations,
                PolicyAssignments = policyAssignments,
                FederatedCredentials = federatedCredentials,
                FederatedCredentialsFilePresent = federatedCredentialsFilePresent,
                EntraGroupMemberships = entraGroupMemberships,
                EntraGroupMembershipsFilePresent = entraGroupMembershipsFilePresent,
                DefenderSummary = defenderSummary,
                EffectiveNetworkControls = effectiveNetworkControls,
                EffectiveNetworkControlsFilePresent = effectiveNetworkControlsFilePresent,
                AdfLinkedServices = adfLinkedServices,
                AdfLinkedServicesFilePresent = adfLinkedServicesFilePresent,
                AdfDatasets = adfDatasets,
                AdfDatasetsFilePresent = adfDatasetsFilePresent,
                AdfPipelineFlows = adfPipelineFlows,
                AdfPipelineFlowsFilePresent = adfPipelineFlowsFilePresent,
                AdfTriggers = adfTriggers,
                AdfTriggersFilePresent = adfTriggersFilePresent,
                AdfIntegrationRuntimes = adfIntegrationRuntimes,
                AdfIntegrationRuntimesFilePresent = adfIntegrationRuntimesFilePresent,
                AdfDataflows = adfDataflows,
                AdfDataflowsFilePresent = adfDataflowsFilePresent,
                EventGridSubscriptions = eventGridSubscriptions,
                EventGridSubscriptionsFilePresent = eventGridSubscriptionsFilePresent,
                LogicAppConnections = logicAppConnections,
                LogicAppConnectionsFilePresent = logicAppConnectionsFilePresent,
                MessagingAssociations = messagingAssociations,
                MessagingAssociationsFilePresent = messagingAssociationsFilePresent,
            };
        }
        catch (JsonException ex)
        {
            return AzureExtractorPackageInventoryReadResult.Failed(ex.Message);
        }
        catch (InvalidDataException ex)
        {
            return AzureExtractorPackageInventoryReadResult.Failed(ex.Message);
        }
    }

    private static List<AzureExtractorExtendedResourceRow> ReadResources(ZipArchive archive)
    {
        ZipArchiveEntry? entry = FindEntry(archive, AzureExtractorPackageZipEntryNames.Resources);

        if (entry is null)
            return [];

        using Stream stream = entry.Open();

        try
        {
            using JsonDocument document = JsonDocument.Parse(stream);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
                throw new JsonException("resources.json root must be a JSON array.");

            List<AzureExtractorExtendedResourceRow> rows = [];

            foreach (JsonElement row in document.RootElement.EnumerateArray())
            {
                if (row.ValueKind is not JsonValueKind.Object)
                    continue;

                AzureExtractorExtendedResourceRow? mapped = MapResourceRow(row);

                if (mapped is not null)
                    rows.Add(mapped);
            }

            return rows;
        }
        catch (JsonException ex) when (ex.Message.Contains("root must be a JSON array", StringComparison.Ordinal))
        {
            throw;
        }
        catch (JsonException)
        {
            throw new JsonException("resources.json is not valid JSON.");
        }
    }

    private static AzureExtractorExtendedResourceRow? MapResourceRow(JsonElement row)
    {
        string? azureResourceId = TryReadString(row, "resourceId")
            ?? TryReadString(row, "ResourceId")
            ?? TryReadString(row, "id")
            ?? TryReadString(row, "Id");

        if (string.IsNullOrWhiteSpace(azureResourceId))
            azureResourceId = TryReadString(row, "name") ?? TryReadString(row, "Name");

        string? resourceType = TryReadString(row, "resourceType")
            ?? TryReadString(row, "ResourceType")
            ?? TryReadString(row, "type")
            ?? TryReadString(row, "Type");

        if (string.IsNullOrWhiteSpace(azureResourceId) || string.IsNullOrWhiteSpace(resourceType))
            return null;

        string name = TryReadString(row, "name")
            ?? TryReadString(row, "Name")
            ?? azureResourceId.Split('/').LastOrDefault()
            ?? azureResourceId;
        string? location = TryReadString(row, "location") ?? TryReadString(row, "Location");
        string? resourceGroup = TryReadString(row, "resourceGroup")
            ?? TryReadString(row, "ResourceGroup")
            ?? ExtractResourceGroup(azureResourceId);

        if (!string.IsNullOrWhiteSpace(resourceGroup))
            resourceGroup = resourceGroup.Trim();
        string? skuName = ExtractSku(row);
        IReadOnlyDictionary<string, string> tags = ReadStringDictionary(row, "tags", "Tags");
        IReadOnlyDictionary<string, string> properties = ReadProperties(row);
        bool isUnknown = (row.TryGetProperty("isUnknownType", out JsonElement unknownFlag)
                          || row.TryGetProperty("IsUnknownType", out unknownFlag))
                         && unknownFlag.ValueKind is JsonValueKind.True;

        return new AzureExtractorExtendedResourceRow
        {
            AzureResourceId = azureResourceId.Trim(),
            ResourceType = resourceType.Trim(),
            Name = name.Trim(),
            Location = string.IsNullOrWhiteSpace(location) ? null : location.Trim(),
            ResourceGroup = resourceGroup,
            SkuName = skuName,
            Tags = tags,
            Properties = properties,
            IsUnknownType = isUnknown,
        };
    }

    private static (bool FilePresent, List<AzureInventoryFederatedCredentialRow> Rows) ReadFederatedCredentials(
        ZipArchive archive)
    {
        ZipArchiveEntry? entry = FindEntry(archive, AzureExtractorPackageZipEntryNames.FederatedCredentials);

        if (entry is null)
        {
            return (false, []);
        }

        using Stream stream = entry.Open();

        try
        {
            using JsonDocument document = JsonDocument.Parse(stream);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                throw new JsonException(
                    $"{AzureExtractorPackageZipEntryNames.FederatedCredentials} root must be a JSON array.");
            }

            List<AzureInventoryFederatedCredentialRow> rows = [];

            foreach (JsonElement element in document.RootElement.EnumerateArray())
            {
                if (!AzureInventoryFederatedCredentialParser.TryParse(element, out AzureInventoryFederatedCredentialRow? row, out _))
                {
                    continue;
                }

                if (row is not null)
                {
                    rows.Add(row);
                }
            }

            return (true, rows);
        }
        catch (JsonException ex) when (ex.Message.Contains("root must be a JSON array", StringComparison.Ordinal))
        {
            throw;
        }
        catch (JsonException)
        {
            throw new JsonException($"{AzureExtractorPackageZipEntryNames.FederatedCredentials} is not valid JSON.");
        }
    }

    private static (bool FilePresent, List<AzureInventoryEntraGroupMembershipRow> Rows) ReadEntraGroupMemberships(
        ZipArchive archive)
    {
        ZipArchiveEntry? entry = FindEntry(archive, AzureExtractorPackageZipEntryNames.EntraGroupMemberships);

        if (entry is null)
        {
            return (false, []);
        }

        using Stream stream = entry.Open();

        try
        {
            using JsonDocument document = JsonDocument.Parse(stream);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                throw new JsonException(
                    $"{AzureExtractorPackageZipEntryNames.EntraGroupMemberships} root must be a JSON array.");
            }

            List<AzureInventoryEntraGroupMembershipRow> rows = [];

            foreach (JsonElement element in document.RootElement.EnumerateArray())
            {
                if (!AzureInventoryEntraGroupMembershipParser.TryParse(element, out AzureInventoryEntraGroupMembershipRow? row, out _))
                {
                    continue;
                }

                if (row is not null)
                {
                    rows.Add(row);
                }
            }

            return (true, rows);
        }
        catch (JsonException ex) when (ex.Message.Contains("root must be a JSON array", StringComparison.Ordinal))
        {
            throw;
        }
        catch (JsonException)
        {
            throw new JsonException($"{AzureExtractorPackageZipEntryNames.EntraGroupMemberships} is not valid JSON.");
        }
    }

    private static (bool FilePresent, List<AzureInventoryAdfLinkedServiceRow> Rows) ReadAdfLinkedServices(
        ZipArchive archive)
    {
        ZipArchiveEntry? entry = FindEntry(archive, AzureExtractorPackageZipEntryNames.AdfLinkedServices);

        if (entry is null)
        {
            return (false, []);
        }

        using Stream stream = entry.Open();

        try
        {
            using JsonDocument document = JsonDocument.Parse(stream);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                throw new JsonException(
                    $"{AzureExtractorPackageZipEntryNames.AdfLinkedServices} root must be a JSON array.");
            }

            List<AzureInventoryAdfLinkedServiceRow> rows = [];

            foreach (JsonElement element in document.RootElement.EnumerateArray())
            {
                if (!AzureInventoryAdfLinkedServiceParser.TryParse(element, out AzureInventoryAdfLinkedServiceRow? row, out _))
                {
                    continue;
                }

                if (row is not null)
                {
                    rows.Add(row);
                }
            }

            return (true, rows);
        }
        catch (JsonException ex) when (ex.Message.Contains("root must be a JSON array", StringComparison.Ordinal))
        {
            throw;
        }
        catch (JsonException)
        {
            throw new JsonException($"{AzureExtractorPackageZipEntryNames.AdfLinkedServices} is not valid JSON.");
        }
    }

    private static (bool FilePresent, List<AzureInventoryAdfDatasetRow> Rows) ReadAdfDatasets(
        ZipArchive archive)
    {
        ZipArchiveEntry? entry = FindEntry(archive, AzureExtractorPackageZipEntryNames.AdfDatasets);

        if (entry is null)
        {
            return (false, []);
        }

        using Stream stream = entry.Open();

        try
        {
            using JsonDocument document = JsonDocument.Parse(stream);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                throw new JsonException(
                    $"{AzureExtractorPackageZipEntryNames.AdfDatasets} root must be a JSON array.");
            }

            List<AzureInventoryAdfDatasetRow> rows = [];

            foreach (JsonElement element in document.RootElement.EnumerateArray())
            {
                if (!AzureInventoryAdfDatasetParser.TryParse(element, out AzureInventoryAdfDatasetRow? row, out _))
                {
                    continue;
                }

                if (row is not null)
                {
                    rows.Add(row);
                }
            }

            return (true, rows);
        }
        catch (JsonException ex) when (ex.Message.Contains("root must be a JSON array", StringComparison.Ordinal))
        {
            throw;
        }
        catch (JsonException)
        {
            throw new JsonException($"{AzureExtractorPackageZipEntryNames.AdfDatasets} is not valid JSON.");
        }
    }

    private static (bool FilePresent, List<AzureInventoryAdfPipelineFlowRow> Rows) ReadAdfPipelineFlows(
        ZipArchive archive)
    {
        ZipArchiveEntry? entry = FindEntry(archive, AzureExtractorPackageZipEntryNames.AdfPipelineFlows);

        if (entry is null)
        {
            return (false, []);
        }

        using Stream stream = entry.Open();

        try
        {
            using JsonDocument document = JsonDocument.Parse(stream);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                throw new JsonException(
                    $"{AzureExtractorPackageZipEntryNames.AdfPipelineFlows} root must be a JSON array.");
            }

            List<AzureInventoryAdfPipelineFlowRow> rows = [];

            foreach (JsonElement element in document.RootElement.EnumerateArray())
            {
                if (!AzureInventoryAdfPipelineFlowParser.TryParse(element, out AzureInventoryAdfPipelineFlowRow? row, out _))
                {
                    continue;
                }

                if (row is not null)
                {
                    rows.Add(row);
                }
            }

            return (true, rows);
        }
        catch (JsonException ex) when (ex.Message.Contains("root must be a JSON array", StringComparison.Ordinal))
        {
            throw;
        }
        catch (JsonException)
        {
            throw new JsonException($"{AzureExtractorPackageZipEntryNames.AdfPipelineFlows} is not valid JSON.");
        }
    }

    private static (bool FilePresent, List<AzureInventoryAdfTriggerRow> Rows) ReadAdfTriggers(ZipArchive archive)
    {
        ZipArchiveEntry? entry = FindEntry(archive, AzureExtractorPackageZipEntryNames.AdfTriggers);

        if (entry is null)
        {
            return (false, []);
        }

        using Stream stream = entry.Open();

        try
        {
            using JsonDocument document = JsonDocument.Parse(stream);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                throw new JsonException(
                    $"{AzureExtractorPackageZipEntryNames.AdfTriggers} root must be a JSON array.");
            }

            List<AzureInventoryAdfTriggerRow> rows = [];

            foreach (JsonElement element in document.RootElement.EnumerateArray())
            {
                if (!AzureInventoryAdfTriggerParser.TryParse(element, out AzureInventoryAdfTriggerRow? row, out _))
                {
                    continue;
                }

                if (row is not null)
                {
                    rows.Add(row);
                }
            }

            return (true, rows);
        }
        catch (JsonException ex) when (ex.Message.Contains("root must be a JSON array", StringComparison.Ordinal))
        {
            throw;
        }
        catch (JsonException)
        {
            throw new JsonException($"{AzureExtractorPackageZipEntryNames.AdfTriggers} is not valid JSON.");
        }
    }

    private static (bool FilePresent, List<AzureInventoryAdfIntegrationRuntimeRow> Rows) ReadAdfIntegrationRuntimes(
        ZipArchive archive)
    {
        ZipArchiveEntry? entry = FindEntry(archive, AzureExtractorPackageZipEntryNames.AdfIntegrationRuntimes);

        if (entry is null)
        {
            return (false, []);
        }

        using Stream stream = entry.Open();

        try
        {
            using JsonDocument document = JsonDocument.Parse(stream);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                throw new JsonException(
                    $"{AzureExtractorPackageZipEntryNames.AdfIntegrationRuntimes} root must be a JSON array.");
            }

            List<AzureInventoryAdfIntegrationRuntimeRow> rows = [];

            foreach (JsonElement element in document.RootElement.EnumerateArray())
            {
                if (!AzureInventoryAdfIntegrationRuntimeParser.TryParse(
                        element,
                        out AzureInventoryAdfIntegrationRuntimeRow? row,
                        out _))
                {
                    continue;
                }

                if (row is not null)
                {
                    rows.Add(row);
                }
            }

            return (true, rows);
        }
        catch (JsonException ex) when (ex.Message.Contains("root must be a JSON array", StringComparison.Ordinal))
        {
            throw;
        }
        catch (JsonException)
        {
            throw new JsonException($"{AzureExtractorPackageZipEntryNames.AdfIntegrationRuntimes} is not valid JSON.");
        }
    }

    private static (bool FilePresent, List<AzureInventoryAdfDataflowRow> Rows) ReadAdfDataflows(ZipArchive archive)
    {
        ZipArchiveEntry? entry = FindEntry(archive, AzureExtractorPackageZipEntryNames.AdfDataflows);

        if (entry is null)
        {
            return (false, []);
        }

        using Stream stream = entry.Open();

        try
        {
            using JsonDocument document = JsonDocument.Parse(stream);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                throw new JsonException(
                    $"{AzureExtractorPackageZipEntryNames.AdfDataflows} root must be a JSON array.");
            }

            List<AzureInventoryAdfDataflowRow> rows = [];

            foreach (JsonElement element in document.RootElement.EnumerateArray())
            {
                if (!AzureInventoryAdfDataflowParser.TryParse(element, out AzureInventoryAdfDataflowRow? row, out _))
                {
                    continue;
                }

                if (row is not null)
                {
                    rows.Add(row);
                }
            }

            return (true, rows);
        }
        catch (JsonException ex) when (ex.Message.Contains("root must be a JSON array", StringComparison.Ordinal))
        {
            throw;
        }
        catch (JsonException)
        {
            throw new JsonException($"{AzureExtractorPackageZipEntryNames.AdfDataflows} is not valid JSON.");
        }
    }

    private static (bool FilePresent, List<AzureInventoryEventGridSubscriptionRow> Rows) ReadEventGridSubscriptions(
        ZipArchive archive)
    {
        return ReadCompanionRows<AzureInventoryEventGridSubscriptionRow>(
            archive,
            AzureExtractorPackageZipEntryNames.EventGridSubscriptions,
            AzureInventoryEventGridSubscriptionParser.TryParse);
    }

    private static (bool FilePresent, List<AzureInventoryLogicAppConnectionRow> Rows) ReadLogicAppConnections(
        ZipArchive archive)
    {
        return ReadCompanionRows<AzureInventoryLogicAppConnectionRow>(
            archive,
            AzureExtractorPackageZipEntryNames.LogicAppConnections,
            AzureInventoryLogicAppConnectionParser.TryParse);
    }

    private static (bool FilePresent, List<AzureInventoryMessagingAssociationRow> Rows) ReadMessagingAssociations(
        ZipArchive archive)
    {
        return ReadCompanionRows<AzureInventoryMessagingAssociationRow>(
            archive,
            AzureExtractorPackageZipEntryNames.MessagingAssociations,
            AzureInventoryMessagingAssociationParser.TryParse);
    }

    private static (bool FilePresent, List<TRow> Rows) ReadCompanionRows<TRow>(
        ZipArchive archive,
        string entryName,
        TryParseCompanionRow<TRow> tryParse)
        where TRow : class
    {
        ZipArchiveEntry? entry = FindEntry(archive, entryName);

        if (entry is null)
        {
            return (false, []);
        }

        using Stream stream = entry.Open();

        try
        {
            using JsonDocument document = JsonDocument.Parse(stream);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                throw new JsonException($"{entryName} root must be a JSON array.");
            }

            List<TRow> rows = [];

            foreach (JsonElement element in document.RootElement.EnumerateArray())
            {
                if (!tryParse(element, out TRow? row, out _))
                {
                    continue;
                }

                if (row is not null)
                {
                    rows.Add(row);
                }
            }

            return (true, rows);
        }
        catch (JsonException ex) when (ex.Message.Contains("root must be a JSON array", StringComparison.Ordinal))
        {
            throw;
        }
        catch (JsonException)
        {
            throw new JsonException($"{entryName} is not valid JSON.");
        }
    }

    private delegate bool TryParseCompanionRow<TRow>(JsonElement element, out TRow? row, out string? errorMessage)
        where TRow : class;

    private static (bool FilePresent, List<AzureInventoryEffectiveNetworkControlRow> Rows) ReadEffectiveNetworkControls(
        ZipArchive archive)
    {
        ZipArchiveEntry? entry = FindEntry(archive, AzureExtractorPackageZipEntryNames.EffectiveNetworkControls);

        if (entry is null)
        {
            return (false, []);
        }

        using Stream stream = entry.Open();

        try
        {
            using JsonDocument document = JsonDocument.Parse(stream);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                throw new JsonException(
                    $"{AzureExtractorPackageZipEntryNames.EffectiveNetworkControls} root must be a JSON array.");
            }

            List<AzureInventoryEffectiveNetworkControlRow> rows = [];

            foreach (JsonElement element in document.RootElement.EnumerateArray())
            {
                if (!AzureInventoryEffectiveNetworkControlParser.TryParse(element, out AzureInventoryEffectiveNetworkControlRow? row, out _))
                {
                    continue;
                }

                if (row is not null)
                {
                    rows.Add(row);
                }
            }

            return (true, rows);
        }
        catch (JsonException ex) when (ex.Message.Contains("root must be a JSON array", StringComparison.Ordinal))
        {
            throw;
        }
        catch (JsonException)
        {
            throw new JsonException($"{AzureExtractorPackageZipEntryNames.EffectiveNetworkControls} is not valid JSON.");
        }
    }

    private static List<JsonElement> ReadOptionalArray(ZipArchive archive, string entryName)
    {
        ZipArchiveEntry? entry = FindEntry(archive, entryName);

        if (entry is null)
            return [];

        using Stream stream = entry.Open();

        try
        {
            using JsonDocument document = JsonDocument.Parse(stream);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
                throw new JsonException($"{entryName} root must be a JSON array.");

            return document.RootElement.EnumerateArray().Select(static element => element.Clone()).ToList();
        }
        catch (JsonException ex) when (ex.Message.Contains("root must be a JSON array", StringComparison.Ordinal))
        {
            throw;
        }
        catch (JsonException)
        {
            throw new JsonException($"{entryName} is not valid JSON.");
        }
    }

    private static ZipArchiveEntry? FindEntry(ZipArchive archive, string entryName) =>
        archive.GetEntry(entryName)
        ?? archive.Entries.FirstOrDefault(entry => entryName.Equals(entry.Name, StringComparison.OrdinalIgnoreCase));

    private static string? ExtractResourceGroup(string azureResourceId)
    {
        string[] parts = azureResourceId.Split('/', StringSplitOptions.RemoveEmptyEntries);

        for (int index = 0; index < parts.Length - 1; index++)
        {
            if (parts[index].Equals("resourceGroups", StringComparison.OrdinalIgnoreCase))
                return parts[index + 1];
        }

        return null;
    }

    private static string? ExtractSku(JsonElement row)
    {
        if (!row.TryGetProperty("sku", out JsonElement sku) && !row.TryGetProperty("Sku", out sku))
            return null;

        if (sku.ValueKind is JsonValueKind.String)
        {
            string? skuText = sku.GetString();

            return string.IsNullOrWhiteSpace(skuText) ? null : skuText.Trim();
        }

        if (sku.ValueKind is JsonValueKind.Object)
        {
            if (sku.TryGetProperty("name", out JsonElement skuName) || sku.TryGetProperty("Name", out skuName))
            {
                string? skuText = skuName.GetString();

                return string.IsNullOrWhiteSpace(skuText) ? null : skuText.Trim();
            }
        }

        return null;
    }

    private static IReadOnlyDictionary<string, string> ReadStringDictionary(JsonElement row, params string[] propertyNames)
    {
        foreach (string propertyName in propertyNames)
        {
            if (!row.TryGetProperty(propertyName, out JsonElement dictionary))
                continue;

            if (dictionary.ValueKind is not JsonValueKind.Object)
                return new Dictionary<string, string>();

            return ReadStringDictionaryValues(dictionary);
        }

        return new Dictionary<string, string>();
    }

    private static IReadOnlyDictionary<string, string> ReadStringDictionaryValues(JsonElement dictionary)
    {
        Dictionary<string, string> values = new(StringComparer.OrdinalIgnoreCase);

        foreach (JsonProperty property in dictionary.EnumerateObject())
        {
            if (property.Value.ValueKind is not JsonValueKind.String)
                continue;

            string value = property.Value.GetString() ?? string.Empty;

            if (AzureExtractorSensitivePropertyRedactor.IsSensitiveKey(property.Name))
                value = AzureExtractorSensitivePropertyRedactor.RedactValue(value);

            values[property.Name] = value;
        }

        return values;
    }

    private static IReadOnlyDictionary<string, string> ReadProperties(JsonElement row)
    {
        if (!row.TryGetProperty("properties", out JsonElement properties)
            && !row.TryGetProperty("Properties", out properties))
            return new Dictionary<string, string>();

        if (properties.ValueKind is not JsonValueKind.Object)
            return new Dictionary<string, string>();

        Dictionary<string, string> values = new(StringComparer.OrdinalIgnoreCase);

        foreach (JsonProperty property in properties.EnumerateObject())
        {
            string serialized = property.Value.ValueKind switch
            {
                JsonValueKind.String => property.Value.GetString() ?? string.Empty,
                JsonValueKind.Number => property.Value.GetRawText(),
                JsonValueKind.True => "true",
                JsonValueKind.False => "false",
                JsonValueKind.Null => string.Empty,
                JsonValueKind.Object or JsonValueKind.Array =>
                    AzureExtractorSensitivePropertyRedactor.RedactStructuredJson(property.Value),
                _ => property.Value.GetRawText(),
            };

            if (property.Value.ValueKind is JsonValueKind.String
                    or JsonValueKind.Number
                    or JsonValueKind.True
                    or JsonValueKind.False
                && AzureExtractorSensitivePropertyRedactor.IsSensitiveKey(property.Name))
                serialized = AzureExtractorSensitivePropertyRedactor.RedactValue(serialized);

            if (serialized.Length > 4000)
                serialized = serialized[..4000];

            values[property.Name] = serialized;
        }

        return values;
    }

    private static string? TryReadString(JsonElement row, string propertyName)
    {
        if (!row.TryGetProperty(propertyName, out JsonElement value))
            return null;

        return value.ValueKind is JsonValueKind.String ? value.GetString() : value.GetRawText().Trim('"');
    }
}

public sealed class AzureExtractorPackageInventoryReadResult
{
    public bool Succeeded
    {
        get;
        init;
    } = true;

    public string? Error
    {
        get;
        init;
    }

    public IReadOnlyList<AzureExtractorExtendedResourceRow> Resources
    {
        get;
        init;
    } = [];

    public IReadOnlyList<JsonElement> RoleAssignments
    {
        get;
        init;
    } = [];

    public IReadOnlyList<JsonElement> DiagnosticSettings
    {
        get;
        init;
    } = [];

    public IReadOnlyList<JsonElement> NetworkAssociations
    {
        get;
        init;
    } = [];

    public IReadOnlyList<JsonElement> PolicyAssignments
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryFederatedCredentialRow> FederatedCredentials
    {
        get;
        init;
    } = [];

    public bool FederatedCredentialsFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryEntraGroupMembershipRow> EntraGroupMemberships
    {
        get;
        init;
    } = [];

    public bool EntraGroupMembershipsFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<JsonElement> DefenderSummary
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryEffectiveNetworkControlRow> EffectiveNetworkControls
    {
        get;
        init;
    } = [];

    public bool EffectiveNetworkControlsFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryAdfLinkedServiceRow> AdfLinkedServices
    {
        get;
        init;
    } = [];

    public bool AdfLinkedServicesFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryAdfDatasetRow> AdfDatasets
    {
        get;
        init;
    } = [];

    public bool AdfDatasetsFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryAdfPipelineFlowRow> AdfPipelineFlows
    {
        get;
        init;
    } = [];

    public bool AdfPipelineFlowsFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryAdfTriggerRow> AdfTriggers
    {
        get;
        init;
    } = [];

    public bool AdfTriggersFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryAdfIntegrationRuntimeRow> AdfIntegrationRuntimes
    {
        get;
        init;
    } = [];

    public bool AdfIntegrationRuntimesFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryAdfDataflowRow> AdfDataflows
    {
        get;
        init;
    } = [];

    public bool AdfDataflowsFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryEventGridSubscriptionRow> EventGridSubscriptions
    {
        get;
        init;
    } = [];

    public bool EventGridSubscriptionsFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryLogicAppConnectionRow> LogicAppConnections
    {
        get;
        init;
    } = [];

    public bool LogicAppConnectionsFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryMessagingAssociationRow> MessagingAssociations
    {
        get;
        init;
    } = [];

    public bool MessagingAssociationsFilePresent
    {
        get;
        init;
    }

    public static AzureExtractorPackageInventoryReadResult Failed(string error) =>
        new() { Succeeded = false, Error = error };
}
