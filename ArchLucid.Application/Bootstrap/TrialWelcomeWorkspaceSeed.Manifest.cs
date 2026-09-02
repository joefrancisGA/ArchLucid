using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Bootstrap;

internal static partial class TrialWelcomeWorkspaceSeed
{
    internal static GoldenManifest BuildManifest(string runId, string manifestVersion)
    {
        ManifestGovernance gov = new()
        {
            ComplianceTags = ["PCI-DSS", "GDPR"],
            PolicyConstraints =
            [
                "No public SQL endpoints",
                "Secrets only from Key Vault with rotation policy",
                "Front Door WAF blocks legacy origin spoofing patterns"
            ],
            RequiredControls = ["AzureFrontDoor", "PrivateEndpoints", "DefenderForCloud", "AzureMonitor"],
            RiskClassification = "Moderate",
            CostClassification = "Moderate"
        };
        const string storefront = "svc-storefront-ui";
        const string bff = "svc-commerce-bff";
        const string catalog = "svc-catalog-api";
        const string orders = "svc-orders-api";
        const string paymentAdapter = "svc-payment-adapter";
        const string ordersDb = "ds-orders-sql";
        const string sessionCache = "ds-session-redis";
        List<ManifestService> services =
        [
            new()
            {
                ServiceId = storefront,
                ServiceName = "Storefront UI",
                ServiceType = ServiceType.Ui,
                RuntimePlatform = RuntimePlatform.AppService,
                Purpose = "React storefront behind Azure Front Door.",
                Tags = ["public-edge"],
                RequiredControls = ["WAF", "ManagedTls"]
            },
            new()
            {
                ServiceId = bff,
                ServiceName = "Commerce BFF",
                ServiceType = ServiceType.Api,
                RuntimePlatform = RuntimePlatform.ContainerApps,
                Purpose = "Aggregates catalog, cart, and checkout orchestration for the UI.",
                Tags = ["internal-spoke"],
                RequiredControls = ["ManagedIdentity", "PrivateLink"]
            },
            new()
            {
                ServiceId = catalog,
                ServiceName = "Catalog API",
                ServiceType = ServiceType.Api,
                RuntimePlatform = RuntimePlatform.ContainerApps,
                Purpose = "Product search, pricing views, and merchandising reads.",
                Tags = ["data-reader"],
                RequiredControls = ["ManagedIdentity"]
            },
            new()
            {
                ServiceId = orders,
                ServiceName = "Orders API",
                ServiceType = ServiceType.Api,
                RuntimePlatform = RuntimePlatform.ContainerApps,
                Purpose = "Order lifecycle, reservations, and fulfillment hooks.",
                Tags = ["transactional"],
                RequiredControls = ["ManagedIdentity", "EncryptionAtRest"]
            },
            new()
            {
                ServiceId = paymentAdapter,
                ServiceName = "Payment adapter",
                ServiceType = ServiceType.Integration,
                RuntimePlatform = RuntimePlatform.ContainerApps,
                Purpose = "Bridges checkout to external PSP with network-isolated callbacks.",
                Tags = ["pci-adjacent"],
                RequiredControls = ["PrivateEgress", "KeyVaultReferences"]
            }
        ];
        List<ManifestDatastore> datastores =
        [
            new()
            {
                DatastoreId = ordersDb,
                DatastoreName = "Orders SQL",
                DatastoreType = DatastoreType.Sql,
                RuntimePlatform = RuntimePlatform.SqlServer,
                Purpose = "Authoritative order and payment reference data (no PAN storage)."
            },
            new()
            {
                DatastoreId = sessionCache,
                DatastoreName = "Session cache",
                DatastoreType = DatastoreType.Cache,
                RuntimePlatform = RuntimePlatform.Redis,
                Purpose = "Cart and session edges with TTL for peak shopping events."
            }
        ];
        List<ManifestRelationship> relationships =
        [
            new()
            {
                RelationshipId = $"{storefront}-to-{bff}",
                SourceId = storefront,
                TargetId = bff,
                RelationshipType = RelationshipType.Calls,
                Description = "Storefront calls the commerce BFF for authenticated APIs."
            },
            new()
            {
                RelationshipId = $"{bff}-to-{catalog}",
                SourceId = bff,
                TargetId = catalog,
                RelationshipType = RelationshipType.Calls,
                Description = "BFF queries catalog for product detail and availability."
            },
            new()
            {
                RelationshipId = $"{bff}-to-{orders}",
                SourceId = bff,
                TargetId = orders,
                RelationshipType = RelationshipType.Calls,
                Description = "BFF creates and updates orders during checkout."
            },
            new()
            {
                RelationshipId = $"{bff}-to-{paymentAdapter}",
                SourceId = bff,
                TargetId = paymentAdapter,
                RelationshipType = RelationshipType.Calls,
                Description = "Checkout flow invokes payment adapter for tokenized authorization."
            },
            new()
            {
                RelationshipId = $"{orders}-writes-{ordersDb}",
                SourceId = orders,
                TargetId = ordersDb,
                RelationshipType = RelationshipType.WritesTo,
                Description = "Orders API persists transactional state."
            },
            new()
            {
                RelationshipId = $"{bff}-uses-{sessionCache}",
                SourceId = bff,
                TargetId = sessionCache,
                RelationshipType = RelationshipType.WritesTo,
                Description = "BFF stages session and cart hydration in Redis."
            }
        ];
        return new GoldenManifest
        {
            RunId = runId,
            SystemName = SystemName,
            Services = services,
            Datastores = datastores,
            Relationships = relationships,
            Governance = gov,
            Metadata = new ManifestMetadata
            {
                ManifestVersion = manifestVersion,
                ParentManifestVersion = null,
                ChangeDescription = "Trial welcome sample — Azure ecommerce modernization",
                DecisionTraceIds = [],
                CreatedUtc = SnapshotUtc
            }
        };
    }
}
