using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Bootstrap;

internal static partial class ProductTourWorkspaceSeed
{
    internal static GoldenManifest BuildManifest(string legacyRunIdN)
    {
        ManifestGovernance gov = new()
        {
            ComplianceTags = ["ISO27001-aligned", "AI-Governance-Pack-A", "Security-Baseline-Pack-B"],
            PolicyConstraints =
            [
                "Private connectivity for inference endpoints where models access production-tagged data classifications",
                "Azure Policy deny rules for sovereign regions on training stores",
                "Conditional Access + MFA parity for privileged platform roles",
            ],
            RequiredControls = ["PrivateEndpoints", "KeyVaultIntegratedSecrets", "DefenderForCloud", "AzureMonitor"],
            RiskClassification = "Moderate",
            CostClassification = "Moderate",
        };

        const string svcApim = "svc-contoso-platform-apim";
        const string svcAcaWorkload = "svc-contoso-ai-batch";
        const string svcAoaiInfer = "svc-contoso-foundry-gateway";
        const string cosmosTraining = "ds-cosmos-ai-training-catalog";
        const string kvSecrets = "ds-kv-platform-secrets";

        List<ManifestService> services =
        [
            new()
            {
                ServiceId = svcApim,
                ServiceName = "Platform API Management",
                ServiceType = ServiceType.Integration,
                RuntimePlatform = RuntimePlatform.Unknown,
                Purpose = "External REST façade for SaaS workloads (synthetic demonstration).",
                Tags = ["public-edge"],
                RequiredControls = ["ManagedTls", "WafBaseline"],
            },
            new()
            {
                ServiceId = svcAcaWorkload,
                ServiceName = "AI Batch Workloads",
                ServiceType = ServiceType.Worker,
                RuntimePlatform = RuntimePlatform.ContainerApps,
                Purpose = "Scheduled embeddings refresh jobs on Container Apps profiles.",
                Tags = ["internal-spoke"],
                RequiredControls = ["ManagedIdentity"],
            },
            new()
            {
                ServiceId = svcAoaiInfer,
                ServiceName = "Azure OpenAI Gateway",
                ServiceType = ServiceType.AiService,
                RuntimePlatform = RuntimePlatform.AzureOpenAi,
                Purpose = "Policy-gated completions and embeddings routed through private egress endpoints.",
                Tags = ["ai-plane"],
                RequiredControls = ["PrivateLink"],
            },
        ];

        List<ManifestDatastore> datastores =
        [
            new()
            {
                DatastoreId = cosmosTraining,
                DatastoreName = "Cosmos DB — Synthetic Training Corpus",
                DatastoreType = DatastoreType.NoSql,
                RuntimePlatform = RuntimePlatform.Unknown,
                Purpose = "Partitioned corpus catalog for responsibly redacted demo tenants (no PHI).",
            },
            new()
            {
                DatastoreId = kvSecrets,
                DatastoreName = "Key Vault — Platform Secrets",
                DatastoreType = DatastoreType.Unknown,
                RuntimePlatform = RuntimePlatform.KeyVault,
                Purpose = "Secrets bridge for ingestion keys + Foundry-managed credentials.",
            },
        ];

        List<ManifestRelationship> relationships =
        [
            new()
            {
                RelationshipId = $"rel-{svcApim}-calls-{svcAcaWorkload}",
                SourceId = svcApim,
                TargetId = svcAcaWorkload,
                RelationshipType = RelationshipType.Calls,
                Description = "Operational personas trigger ACA jobs through APIM policies.",
            },
            new()
            {
                RelationshipId = $"rel-{svcAcaWorkload}-writes-{cosmosTraining}",
                SourceId = svcAcaWorkload,
                TargetId = cosmosTraining,
                RelationshipType = RelationshipType.WritesTo,
                Description = "Batch workloads publish validated embedding deltas into Cosmos partitions.",
            },
            new()
            {
                RelationshipId = $"rel-{svcAoaiInfer}-reads-{cosmosTraining}",
                SourceId = svcAoaiInfer,
                TargetId = cosmosTraining,
                RelationshipType = RelationshipType.ReadsFrom,
                Description = "Retrieval workflows pull curated subsets for completions.",
            },
            new()
            {
                RelationshipId = $"rel-{svcAoaiInfer}-authenticates-{kvSecrets}",
                SourceId = svcAoaiInfer,
                TargetId = kvSecrets,
                RelationshipType = RelationshipType.AuthenticatesWith,
                Description = "Gateway authenticates outbound calls using KV-backed secrets exclusively.",
            },
        ];

        return new GoldenManifest
        {
            RunId = legacyRunIdN,
            SystemName = SystemName,
            Services = services,
            Datastores = datastores,
            Relationships = relationships,
            Governance = gov,
            Metadata = new ManifestMetadata
            {
                ManifestVersion = ManifestVersion,
                ParentManifestVersion = null,
                ChangeDescription = "Synthetic Product Tour package — Workspace A self-demo tour.",
                DecisionTraceIds = [],
                CreatedUtc = SeedUtc,
            },
        };
    }
}
