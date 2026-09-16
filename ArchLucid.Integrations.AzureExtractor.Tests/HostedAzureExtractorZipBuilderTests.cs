using System.IO.Compression;
using System.Text.Json;

using ArchLucid.Application.AzureExtractor;
using ArchLucid.Core.AzureExtractor;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;
[Trait("Category", "Unit")]

public sealed class HostedAzureExtractorZipBuilderTests
{
    [Fact]
    public void BuildZip_contains_manifest_resources_and_policy_compliance_entries()
    {
        HostedAzureArmResourceRecord resource = new(
            "Microsoft.Compute/virtualMachines",
            "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1",
            "vm1",
            "eastus",
            null,
            null,
            new Dictionary<string, object?> { ["provisioningState"] = "Succeeded" });

        byte[] zipBytes = HostedAzureExtractorZipBuilder.BuildZip(
            "11111111-1111-1111-1111-111111111111",
            [resource],
            includeCostRequested: false,
            DateTimeOffset.Parse("2026-05-21T12:00:00Z"));

        using MemoryStream stream = new(zipBytes);
        using ZipArchive archive = new(stream, ZipArchiveMode.Read);

        Assert.NotNull(archive.GetEntry("manifest.json"));
        Assert.NotNull(archive.GetEntry("resources.json"));
        Assert.NotNull(archive.GetEntry("policy-compliance.json"));
        Assert.NotNull(archive.GetEntry(AzureExtractorPackageZipEntryNames.FederatedCredentials));
        Assert.NotNull(archive.GetEntry("README.txt"));

        stream.Position = 0;

        (AzureExtractorNormalizedManifest? manifest, string? error) =
            AzureExtractorManifestReader.TryReadNormalizedFromZip(stream);

        Assert.Null(error);
        Assert.NotNull(manifest);
        Assert.Equal(2, manifest!.SchemaVersion);
        Assert.Equal("11111111-1111-1111-1111-111111111111", manifest.SubscriptionId);
        Assert.Null(manifest.SubscriptionName);
    }

    [Fact]
    public void BuildZip_writes_normalized_subscription_name()
    {
        byte[] zipBytes = HostedAzureExtractorZipBuilder.BuildZip(
            "11111111-1111-1111-1111-111111111111",
            Array.Empty<HostedAzureArmResourceRecord>(),
            includeCostRequested: false,
            DateTimeOffset.Parse("2026-05-21T12:00:00Z"),
            "  Contoso Production  ");

        using MemoryStream stream = new(zipBytes);

        (AzureExtractorNormalizedManifest? manifest, string? error) =
            AzureExtractorManifestReader.TryReadNormalizedFromZip(stream);

        Assert.Null(error);
        Assert.NotNull(manifest);
        Assert.Equal("Contoso Production", manifest!.SubscriptionName);
    }

    [Fact]
    public void BuildZip_manifest_is_schema_version_2()
    {
        byte[] zipBytes = HostedAzureExtractorZipBuilder.BuildZip(
            "22222222-2222-2222-2222-222222222222",
            Array.Empty<HostedAzureArmResourceRecord>(),
            includeCostRequested: true,
            DateTimeOffset.UtcNow);

        using MemoryStream stream = new(zipBytes);
        using ZipArchive archive = new(stream, ZipArchiveMode.Read);

        using Stream manifestStream = archive.GetEntry("manifest.json")!.Open();
        using StreamReader reader = new(manifestStream);
        string json = reader.ReadToEnd();

        using JsonDocument document = JsonDocument.Parse(json);
        Assert.Equal(2, document.RootElement.GetProperty("schemaVersion").GetInt32());
        Assert.Equal(JsonValueKind.Null, document.RootElement.GetProperty("actualCostSummary").ValueKind);
    }

    [Fact]
    public void BuildZip_manifest_includes_management_group_scope()
    {
        byte[] zipBytes = HostedAzureExtractorZipBuilder.BuildZip(
            subscriptionId: null,
            Array.Empty<HostedAzureArmResourceRecord>(),
            includeCostRequested: false,
            DateTimeOffset.Parse("2026-05-21T12:00:00Z"),
            managementGroupId: "corp-prod");

        using MemoryStream stream = new(zipBytes);
        using ZipArchive archive = new(stream, ZipArchiveMode.Read);

        using Stream manifestStream = archive.GetEntry("manifest.json")!.Open();
        using StreamReader reader = new(manifestStream);
        string json = reader.ReadToEnd();

        using JsonDocument document = JsonDocument.Parse(json);
        Assert.Equal("corp-prod", document.RootElement.GetProperty("managementGroupId").GetString());
        Assert.Equal(JsonValueKind.Null, document.RootElement.GetProperty("subscriptionId").ValueKind);
        Assert.Equal(
            "/providers/Microsoft.Management/managementGroups/corp-prod",
            document.RootElement.GetProperty("scope").GetString());

        stream.Position = 0;

        (AzureExtractorNormalizedManifest? manifest, string? error) =
            AzureExtractorManifestReader.TryReadNormalizedFromZip(stream);

        Assert.Null(error);
        Assert.NotNull(manifest);
        Assert.Equal(string.Empty, manifest!.SubscriptionId);
    }

    [Fact]
    public void BuildZip_writes_policy_and_diagnostic_companion_entries()
    {
        byte[] zipBytes = HostedAzureExtractorZipBuilder.BuildZip(
            "11111111-1111-1111-1111-111111111111",
            Array.Empty<HostedAzureArmResourceRecord>(),
            includeCostRequested: false,
            DateTimeOffset.Parse("2026-05-21T12:00:00Z"),
            policyAssignments:
            [
                new HostedAzureArmPolicyAssignmentRecord(
                    "/providers/Microsoft.Management/managementGroups/corp",
                    "/providers/Microsoft.Authorization/policyDefinitions/audit-storage",
                    "assign1",
                    "/providers/Microsoft.Management/managementGroups/corp/providers/Microsoft.Authorization/policyAssignments/assign1"),
            ],
            diagnosticSettings:
            [
                new HostedAzureArmDiagnosticSettingRecord(
                    "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                    "diag-to-law",
                    "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationalInsights/workspaces/ws1",
                    null,
                    null),
            ]);

        using MemoryStream stream = new(zipBytes);
        using ZipArchive archive = new(stream, ZipArchiveMode.Read);

        using Stream policyStream = archive.GetEntry(AzureExtractorPackageZipEntryNames.PolicyAssignments)!.Open();
        using StreamReader policyReader = new(policyStream);
        using JsonDocument policyDocument = JsonDocument.Parse(policyReader.ReadToEnd());
        Assert.Equal("assign1", policyDocument.RootElement[0].GetProperty("name").GetString());

        using Stream diagnosticStream = archive.GetEntry(AzureExtractorPackageZipEntryNames.DiagnosticSettings)!.Open();
        using StreamReader diagnosticReader = new(diagnosticStream);
        using JsonDocument diagnosticDocument = JsonDocument.Parse(diagnosticReader.ReadToEnd());
        Assert.Equal("diag-to-law", diagnosticDocument.RootElement[0].GetProperty("name").GetString());
    }

    [Fact]
    public void BuildZip_writes_defender_summary_companion_entries()
    {
        byte[] zipBytes = HostedAzureExtractorZipBuilder.BuildZip(
            "11111111-1111-1111-1111-111111111111",
            Array.Empty<HostedAzureArmResourceRecord>(),
            includeCostRequested: false,
            DateTimeOffset.Parse("2026-05-21T12:00:00Z"),
            defenderSummaries:
            [
                new HostedAzureArmDefenderSummaryRecord
                {
                    ResourceId = "/subscriptions/11111111-1111-1111-1111-111111111111",
                    SecureScore = 72,
                },
            ]);

        using MemoryStream stream = new(zipBytes);
        using ZipArchive archive = new(stream, ZipArchiveMode.Read);

        using Stream defenderStream = archive.GetEntry(AzureExtractorPackageZipEntryNames.DefenderSummary)!.Open();
        using StreamReader defenderReader = new(defenderStream);
        using JsonDocument defenderDocument = JsonDocument.Parse(defenderReader.ReadToEnd());
        Assert.Equal(72, defenderDocument.RootElement[0].GetProperty("secureScore").GetInt32());
    }

    [Fact]
    public void BuildZip_writes_adf_linked_service_companion_entries()
    {
        AzureInventoryAdfLinkedServiceRow row = new()
        {
            FactoryResourceId =
                "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1",
            LinkedServiceResourceId =
                "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/linkedservices/BlobLS",
            LinkedServiceName = "BlobLS",
            LinkedServiceType = "AzureBlobStorage",
            TargetHost = "sa1.blob.core.windows.net",
            CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
        };

        byte[] zipBytes = HostedAzureExtractorZipBuilder.BuildZip(
            "11111111-1111-1111-1111-111111111111",
            Array.Empty<HostedAzureArmResourceRecord>(),
            includeCostRequested: false,
            DateTimeOffset.Parse("2026-05-21T12:00:00Z"),
            adfLinkedServices: [row]);

        using MemoryStream stream = new(zipBytes);
        using ZipArchive archive = new(stream, ZipArchiveMode.Read);

        using Stream adfStream = archive.GetEntry(AzureExtractorPackageZipEntryNames.AdfLinkedServices)!.Open();
        using StreamReader adfReader = new(adfStream);
        using JsonDocument adfDocument = JsonDocument.Parse(adfReader.ReadToEnd());
        Assert.Equal("BlobLS", adfDocument.RootElement[0].GetProperty("linkedServiceName").GetString());
    }

    [Fact]
    public void BuildZip_writes_adf_extended_metadata_companion_entries()
    {
        const string factoryId =
            "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1";

        AzureInventoryAdfTriggerRow trigger = new()
        {
            FactoryResourceId = factoryId,
            TriggerResourceId = $"{factoryId}/triggers/ScheduleTrigger",
            TriggerName = "ScheduleTrigger",
            TriggerType = "ScheduleTrigger",
            CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
        };

        AzureInventoryAdfIntegrationRuntimeRow integrationRuntime = new()
        {
            FactoryResourceId = factoryId,
            IntegrationRuntimeResourceId = $"{factoryId}/integrationruntimes/AutoResolveIntegrationRuntime",
            Name = "AutoResolveIntegrationRuntime",
            Kind = "Managed",
            CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
        };

        AzureInventoryAdfDataflowRow dataflow = new()
        {
            FactoryResourceId = factoryId,
            DataflowResourceId = $"{factoryId}/dataflows/df1",
            DataflowName = "df1",
            SourceLinkedServiceNames = ["BlobLS"],
            SinkLinkedServiceNames = ["SqlLS"],
        };

        byte[] zipBytes = HostedAzureExtractorZipBuilder.BuildZip(
            "11111111-1111-1111-1111-111111111111",
            Array.Empty<HostedAzureArmResourceRecord>(),
            includeCostRequested: false,
            DateTimeOffset.Parse("2026-05-21T12:00:00Z"),
            adfTriggers: [trigger],
            adfIntegrationRuntimes: [integrationRuntime],
            adfDataflows: [dataflow]);

        using MemoryStream stream = new(zipBytes);
        using ZipArchive archive = new(stream, ZipArchiveMode.Read);

        using Stream triggerStream = archive.GetEntry(AzureExtractorPackageZipEntryNames.AdfTriggers)!.Open();
        using StreamReader triggerReader = new(triggerStream);
        using JsonDocument triggerDocument = JsonDocument.Parse(triggerReader.ReadToEnd());
        Assert.Equal("ScheduleTrigger", triggerDocument.RootElement[0].GetProperty("triggerName").GetString());

        using Stream runtimeStream = archive.GetEntry(AzureExtractorPackageZipEntryNames.AdfIntegrationRuntimes)!.Open();
        using StreamReader runtimeReader = new(runtimeStream);
        using JsonDocument runtimeDocument = JsonDocument.Parse(runtimeReader.ReadToEnd());
        Assert.Equal("AutoResolveIntegrationRuntime", runtimeDocument.RootElement[0].GetProperty("name").GetString());

        using Stream dataflowStream = archive.GetEntry(AzureExtractorPackageZipEntryNames.AdfDataflows)!.Open();
        using StreamReader dataflowReader = new(dataflowStream);
        using JsonDocument dataflowDocument = JsonDocument.Parse(dataflowReader.ReadToEnd());
        Assert.Equal("df1", dataflowDocument.RootElement[0].GetProperty("dataflowName").GetString());
    }

    [Fact]
    public void BuildZip_writes_adf_dataset_and_pipeline_flow_companion_entries()
    {
        AzureInventoryAdfDatasetRow dataset = new()
        {
            FactoryResourceId =
                "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1",
            DatasetResourceId =
                "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/datasets/SourceDs",
            DatasetName = "SourceDs",
            LinkedServiceName = "BlobLS",
        };

        AzureInventoryAdfPipelineFlowRow flow = new()
        {
            FactoryResourceId = dataset.FactoryResourceId,
            PipelineResourceId =
                "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1/pipelines/p1",
            PipelineName = "p1",
            ActivityName = "CopyBlob",
            ActivityType = "Copy",
            FlowDirection = AzureInventoryAdfPipelineFlowDirection.Read,
            DatasetName = "SourceDs",
        };

        byte[] zipBytes = HostedAzureExtractorZipBuilder.BuildZip(
            "11111111-1111-1111-1111-111111111111",
            Array.Empty<HostedAzureArmResourceRecord>(),
            includeCostRequested: false,
            DateTimeOffset.Parse("2026-05-21T12:00:00Z"),
            adfDatasets: [dataset],
            adfPipelineFlows: [flow]);

        using MemoryStream stream = new(zipBytes);
        using ZipArchive archive = new(stream, ZipArchiveMode.Read);

        using Stream datasetStream = archive.GetEntry(AzureExtractorPackageZipEntryNames.AdfDatasets)!.Open();
        using StreamReader datasetReader = new(datasetStream);
        using JsonDocument datasetDocument = JsonDocument.Parse(datasetReader.ReadToEnd());
        Assert.Equal("SourceDs", datasetDocument.RootElement[0].GetProperty("datasetName").GetString());

        using Stream flowStream = archive.GetEntry(AzureExtractorPackageZipEntryNames.AdfPipelineFlows)!.Open();
        using StreamReader flowReader = new(flowStream);
        using JsonDocument flowDocument = JsonDocument.Parse(flowReader.ReadToEnd());
        Assert.Equal("Read", flowDocument.RootElement[0].GetProperty("flowDirection").GetString());
    }

    [Fact]
    public void BuildZip_writes_diagram_enrichment_companion_entries()
    {
        const string topicId =
            "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.EventGrid/topics/orders";
        const string workflowId =
            "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.Logic/workflows/notify";
        const string namespaceId =
            "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ehns1";

        AzureInventoryEventGridSubscriptionRow eventGridSubscription = new()
        {
            SourceResourceId = topicId,
            SubscriptionName = "to-storage",
            DestinationKind = "StorageQueue",
            CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
        };

        AzureInventoryLogicAppConnectionRow logicAppConnection = new()
        {
            WorkflowResourceId = workflowId,
            WorkflowName = "notify",
            ConnectionName = "azureblob",
            ConnectionResourceId =
                "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.Web/connections/azureblob",
            CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
        };

        AzureInventoryMessagingAssociationRow messagingAssociation = new()
        {
            ParentResourceId = namespaceId,
            ChildResourceId = $"{namespaceId}/eventhubs/orders",
            ChildName = "orders",
            ChildType = AzureInventoryMessagingAssociationTypes.EventHub,
            CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
        };

        byte[] zipBytes = HostedAzureExtractorZipBuilder.BuildZip(
            "11111111-1111-1111-1111-111111111111",
            Array.Empty<HostedAzureArmResourceRecord>(),
            includeCostRequested: false,
            DateTimeOffset.Parse("2026-05-21T12:00:00Z"),
            eventGridSubscriptions: [eventGridSubscription],
            logicAppConnections: [logicAppConnection],
            messagingAssociations: [messagingAssociation]);

        using MemoryStream stream = new(zipBytes);
        using ZipArchive archive = new(stream, ZipArchiveMode.Read);

        using Stream eventGridStream = archive.GetEntry(AzureExtractorPackageZipEntryNames.EventGridSubscriptions)!.Open();
        using StreamReader eventGridReader = new(eventGridStream);
        using JsonDocument eventGridDocument = JsonDocument.Parse(eventGridReader.ReadToEnd());
        Assert.Equal("to-storage", eventGridDocument.RootElement[0].GetProperty("subscriptionName").GetString());

        using Stream logicAppStream = archive.GetEntry(AzureExtractorPackageZipEntryNames.LogicAppConnections)!.Open();
        using StreamReader logicAppReader = new(logicAppStream);
        using JsonDocument logicAppDocument = JsonDocument.Parse(logicAppReader.ReadToEnd());
        Assert.Equal("azureblob", logicAppDocument.RootElement[0].GetProperty("connectionName").GetString());

        using Stream messagingStream = archive.GetEntry(AzureExtractorPackageZipEntryNames.MessagingAssociations)!.Open();
        using StreamReader messagingReader = new(messagingStream);
        using JsonDocument messagingDocument = JsonDocument.Parse(messagingReader.ReadToEnd());
        Assert.Equal("orders", messagingDocument.RootElement[0].GetProperty("childName").GetString());
    }

    [Fact]
    public void BuildZip_writes_paas_child_association_companion_entries()
    {
        const string serverId =
            "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1";

        AzureInventoryPaasChildAssociationRow association = new()
        {
            ParentResourceId = serverId,
            ChildResourceId = $"{serverId}/databases/appdb",
            ChildName = "appdb",
            ChildType = AzureInventoryPaasChildAssociationTypes.SqlDatabase,
            CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
        };

        byte[] zipBytes = HostedAzureExtractorZipBuilder.BuildZip(
            "11111111-1111-1111-1111-111111111111",
            Array.Empty<HostedAzureArmResourceRecord>(),
            includeCostRequested: false,
            DateTimeOffset.Parse("2026-05-21T12:00:00Z"),
            paasChildAssociations: [association]);

        using MemoryStream stream = new(zipBytes);
        using ZipArchive archive = new(stream, ZipArchiveMode.Read);

        using Stream paasStream = archive.GetEntry(AzureExtractorPackageZipEntryNames.PaasChildAssociations)!.Open();
        using StreamReader paasReader = new(paasStream);
        using JsonDocument paasDocument = JsonDocument.Parse(paasReader.ReadToEnd());
        Assert.Equal("appdb", paasDocument.RootElement[0].GetProperty("childName").GetString());
    }
}
