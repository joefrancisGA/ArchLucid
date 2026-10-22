using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Bootstrap;

internal static partial class RetailBaselineWorkspaceSeed
{
    internal static GoldenManifest BuildManifest(string runId, string manifestVersion, bool isHardened, bool richSeed)
    {
        ManifestGovernance gov = isHardened
            ? new ManifestGovernance
            {
                ComplianceTags = ["PCI-DSS", "SOC2"],
                PolicyConstraints = ["No public SQL endpoints", "Secrets in Key Vault only"],
                RequiredControls = ["WAF", "PrivateLink", "DefenderForCloud"],
                RiskClassification = "Moderate",
                CostClassification = "Moderate"
            }
            : new ManifestGovernance
            {
                ComplianceTags = ["PCI-DSS"],
                PolicyConstraints = ["HTTPS only"],
                RequiredControls = ["TLS-1.2"],
                RiskClassification = "High",
                CostClassification = "Low"
            };
        // ADR 0030 owner Decision B (2026-04-23): quickstart writes one-of-each minimum (single
        // service + datastore + relationship); vertical writes the production-realistic depth
        // (multiple services + datastore + relationships including a service-to-service edge).
        string checkoutServiceId = isHardened ? "svc-checkout-api-v2" : "svc-checkout-api-v1";
        string ordersDatastoreId = isHardened ? "ds-orders-v2" : "ds-orders-v1";
        List<ManifestService> services =
        [
            new()
            {
                ServiceId = checkoutServiceId,
                ServiceName = "Checkout API",
                ServiceType = ServiceType.Api,
                RuntimePlatform = isHardened ? RuntimePlatform.ContainerApps : RuntimePlatform.AppService,
                Purpose = "Orchestrates cart and payment initiation.",
                Tags = isHardened ? ["edge-hardened"] : ["legacy-monolith"],
                RequiredControls = isHardened ? ["WAF", "ManagedIdentity"] : ["BasicAuthOff"]
            }
        ];
        List<ManifestDatastore> datastores =
        [
            new()
            {
                DatastoreId = ordersDatastoreId,
                DatastoreName = "Orders DB",
                DatastoreType = DatastoreType.Sql,
                RuntimePlatform = RuntimePlatform.SqlServer,
                Purpose = "Order and payment state."
            }
        ];
        List<ManifestRelationship> relationships =
        [
            new()
            {
                RelationshipId = $"rel-{checkoutServiceId}-writes-{ordersDatastoreId}",
                SourceId = checkoutServiceId,
                TargetId = ordersDatastoreId,
                RelationshipType = RelationshipType.WritesTo,
                Description = "Checkout API persists order and payment state."
            }
        ];

        if (!richSeed)
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
                    ChangeDescription = isHardened ? "Hardened retail posture" : "Baseline lift-and-shift",
                    DecisionTraceIds = [],
                    CreatedUtc = RetailBaselineWorkspaceSeed.DemoUtc
                }
            };
        string paymentServiceId = isHardened ? "svc-payment-gateway-v2" : "svc-payment-gateway-v1";
        services.Add(new ManifestService
        {
            ServiceId = paymentServiceId,
            ServiceName = "Payment Gateway",
            ServiceType = ServiceType.Api,
            RuntimePlatform = isHardened ? RuntimePlatform.ContainerApps : RuntimePlatform.AppService,
            Purpose = "Tokenizes card data and brokers payment provider calls.",
            Tags = isHardened ? ["edge-hardened", "pci-scope"] : ["pci-scope"],
            RequiredControls = isHardened ? ["WAF", "ManagedIdentity", "PrivateLink"] : ["TLS-1.2"]
        });
        relationships.Add(new ManifestRelationship
        {
            RelationshipId = $"rel-{checkoutServiceId}-calls-{paymentServiceId}",
            SourceId = checkoutServiceId,
            TargetId = paymentServiceId,
            RelationshipType = RelationshipType.Calls,
            Description = "Checkout API invokes the Payment Gateway during order finalization."
        });
        relationships.Add(new ManifestRelationship
        {
            RelationshipId = $"rel-{paymentServiceId}-reads-{ordersDatastoreId}",
            SourceId = paymentServiceId,
            TargetId = ordersDatastoreId,
            RelationshipType = RelationshipType.ReadsFrom,
            Description = "Payment Gateway reads order context for reconciliation."
        });
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
                ChangeDescription = isHardened ? "Hardened retail posture" : "Baseline lift-and-shift",
                DecisionTraceIds = [],
                CreatedUtc = RetailBaselineWorkspaceSeed.DemoUtc
            }
        };
    }
}
