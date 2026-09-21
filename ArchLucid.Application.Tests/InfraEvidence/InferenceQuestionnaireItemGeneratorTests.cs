using ArchLucid.Application.InfraEvidence.OperatorInferredConnections;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class InferenceQuestionnaireItemGeneratorTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private const string SqlServerHost = "sql1.database.windows.net";
    private const string UiAppId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/containerApps/archlucid-ui";
    private const string ApiAppId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/containerApps/archlucid-api";
    private const string CaeId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/managedEnvironments/cae-dev";

    [Fact]
    public void Generate_catalog_template_emits_one_item_per_user_database_and_skips_master()
    {
        InferenceQuestionnaireItemGenerator generator = new(Mock.Of<IOperatorInferredConnectionRepository>());
        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(sameCae: false);
        InferenceQuestionnaireInput input = new()
        {
            Snapshot = snapshot,
            AppSettingHosts =
            [
                new AzureInventoryAppSettingHostRow
                {
                    SiteResourceId = UiAppId,
                    SettingName = "ArchLucid__SqlTopology__TenantCatalogConnectionStringTemplate",
                    Host = SqlServerHost,
                    WarningCode = AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsCatalogTemplate,
                    CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
                },
            ],
        };

        IReadOnlyList<OperatorInferredConnectionRecord> items =
            generator.Generate(Scope, input, []);

        items.Should().HaveCount(2);
        items.Select(item => item.ToCatalog).Should().BeEquivalentTo(["archlucid", "archlucidtenantedev"]);
        items.Should().OnlyContain(item => item.Source == OperatorInferredConnectionSource.Questionnaire);
        items.Should().OnlyContain(item => item.Status == OperatorInferredConnectionStatus.Proposed);
    }

    [Fact]
    public void Generate_same_cae_ui_api_item_requires_shared_environment()
    {
        InferenceQuestionnaireItemGenerator generator = new(Mock.Of<IOperatorInferredConnectionRepository>());
        AzureInventorySnapshotDetailReadModel sharedCaeSnapshot = BuildSnapshot(sameCae: true);
        AzureInventorySnapshotDetailReadModel differentCaeSnapshot = BuildSnapshot(sameCae: false);

        InferenceQuestionnaireInput sharedInput = new()
        {
            Snapshot = sharedCaeSnapshot,
            AppSettingHosts = [],
        };
        InferenceQuestionnaireInput differentInput = new()
        {
            Snapshot = differentCaeSnapshot,
            AppSettingHosts = [],
        };

        IReadOnlyList<OperatorInferredConnectionRecord> sharedItems =
            generator.Generate(Scope, sharedInput, []);
        IReadOnlyList<OperatorInferredConnectionRecord> differentItems =
            generator.Generate(Scope, differentInput, []);

        sharedItems.Should().ContainSingle(item => item.RuleName == InferenceQuestionnaireItemGenerator.SameCaeUiApiRuleName);
        differentItems.Should().NotContain(item => item.RuleName == InferenceQuestionnaireItemGenerator.SameCaeUiApiRuleName);
    }

    [Fact]
    public void Generate_caps_items_at_fifty()
    {
        InferenceQuestionnaireItemGenerator generator = new(Mock.Of<IOperatorInferredConnectionRepository>());
        List<AzureInventoryResourceRecord> databases = [];

        for (int index = 0; index < 200; index++)
        {
            databases.Add(new AzureInventoryResourceRecord
            {
                ResourceRowId = Guid.NewGuid(),
                SnapshotId = Guid.NewGuid(),
                TenantId = Scope.TenantId,
                AzureResourceId =
                    $"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1/databases/db{index}",
                ResourceType = "Microsoft.Sql/servers/databases",
            });
        }

        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(extraDatabases: databases);
        InferenceQuestionnaireInput input = new()
        {
            Snapshot = snapshot,
            AppSettingHosts =
            [
                new AzureInventoryAppSettingHostRow
                {
                    SiteResourceId = UiAppId,
                    SettingName = "ArchLucid__SqlTopology__TenantCatalogConnectionStringTemplate",
                    Host = SqlServerHost,
                    WarningCode = AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsCatalogTemplate,
                    CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
                },
            ],
        };

        IReadOnlyList<OperatorInferredConnectionRecord> items = generator.Generate(Scope, input, []);

        items.Should().HaveCount(InferenceQuestionnaireItemGenerator.MaxItems);
    }

    [Fact]
    public void Generate_empty_snapshot_returns_no_items()
    {
        InferenceQuestionnaireItemGenerator generator = new(Mock.Of<IOperatorInferredConnectionRepository>());
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = Guid.NewGuid(),
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ProjectId = Scope.ProjectId,
                SubscriptionId = "sub",
            },
        };

        IReadOnlyList<OperatorInferredConnectionRecord> items = generator.Generate(
            Scope,
            new InferenceQuestionnaireInput { Snapshot = snapshot },
            []);

        items.Should().BeEmpty();
    }

    private static AzureInventorySnapshotDetailReadModel BuildSnapshot(
        bool sameCae = true,
        IReadOnlyList<AzureInventoryResourceRecord>? extraDatabases = null)
    {
        Guid uiRowId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid apiRowId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        string secondCaeId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/managedEnvironments/cae-other";

        List<AzureInventoryResourceRecord> resources =
        [
            new()
            {
                ResourceRowId = uiRowId,
                SnapshotId = Guid.NewGuid(),
                TenantId = Scope.TenantId,
                AzureResourceId = UiAppId,
                ResourceType = "Microsoft.App/containerApps",
            },
            new()
            {
                ResourceRowId = apiRowId,
                SnapshotId = Guid.NewGuid(),
                TenantId = Scope.TenantId,
                AzureResourceId = ApiAppId,
                ResourceType = "Microsoft.App/containerApps",
            },
            new()
            {
                ResourceRowId = Guid.NewGuid(),
                SnapshotId = Guid.NewGuid(),
                TenantId = Scope.TenantId,
                AzureResourceId =
                    $"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1",
                ResourceType = "Microsoft.Sql/servers",
            },
            new()
            {
                ResourceRowId = Guid.NewGuid(),
                SnapshotId = Guid.NewGuid(),
                TenantId = Scope.TenantId,
                AzureResourceId =
                    $"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1/databases/archlucid",
                ResourceType = "Microsoft.Sql/servers/databases",
            },
            new()
            {
                ResourceRowId = Guid.NewGuid(),
                SnapshotId = Guid.NewGuid(),
                TenantId = Scope.TenantId,
                AzureResourceId =
                    $"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1/databases/archlucidtenantedev",
                ResourceType = "Microsoft.Sql/servers/databases",
            },
            new()
            {
                ResourceRowId = Guid.NewGuid(),
                SnapshotId = Guid.NewGuid(),
                TenantId = Scope.TenantId,
                AzureResourceId =
                    $"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1/databases/master",
                ResourceType = "Microsoft.Sql/servers/databases",
            },
        ];

        if (extraDatabases is not null)
        {
            resources.AddRange(extraDatabases);
        }

        List<AzureInventoryResourceRelationshipReadModel> relationships =
        [
            new()
            {
                FromAzureResourceId = UiAppId,
                ToAzureResourceId = sameCae ? CaeId : secondCaeId,
                RelationshipType = GraphEdgeTypes.ConnectsTo,
                InferenceSource = GraphEdgeInferenceSources.InventoryContainerAppEnv,
            },
            new()
            {
                FromAzureResourceId = ApiAppId,
                ToAzureResourceId = CaeId,
                RelationshipType = GraphEdgeTypes.ConnectsTo,
                InferenceSource = GraphEdgeInferenceSources.InventoryContainerAppEnv,
            },
        ];

        List<AzureInventoryResourcePropertyReadModel> properties =
        [
            new()
            {
                ResourceRowId = apiRowId,
                PropertyKey = "configuration.ingress.fqdn",
                PropertyValue = "archlucid-api.eastus2.azurecontainerapps.io",
            },
        ];

        return new AzureInventorySnapshotDetailReadModel
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = Guid.NewGuid(),
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ProjectId = Scope.ProjectId,
                SubscriptionId = "sub",
            },
            Resources = resources,
            Relationships = relationships,
            Properties = properties,
        };
    }
}
