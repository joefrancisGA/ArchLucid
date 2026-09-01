using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Bootstrap;

internal static partial class CreatedSampleWorkspaceSeed
{
    internal static GoldenManifest BuildManifest(string legacyRunIdN)
    {
        ManifestGovernance gov = new()
        {
            ComplianceTags = ["AI-Governance-Pack-A", "Security-Baseline-Pack-B", "Responsible-AI-synthetic"],
            PolicyConstraints =
            [
                "All inference and search data planes use private connectivity from the application VNet",
                "System prompts and tool manifests change only through approved pipeline",
                "PII and secrets must not appear in vector index — ingestion enforces redaction patterns (design intent)",
            ],
            RequiredControls = ["PrivateEndpoints", "KeyVaultIntegratedSecrets", "ContentSafety", "AzureMonitor"],
            RiskClassification = "Moderate",
            CostClassification = "Moderate",
        };

        const string svcApim = "svc-northwind-copilot-apim";
        const string svcOrchestrator = "svc-northwind-chat-orchestrator";
        const string svcSearch = "svc-northwind-ai-search";
        const string svcAoai = "svc-northwind-azure-openai";
        const string searchIndex = "ds-northwind-vector-index";
        const string kvSecrets = "ds-northwind-kv-secrets";

        List<ManifestService> services =
        [
            new()
            {
                ServiceId = svcApim,
                ServiceName = "API Management gateway",
                ServiceType = ServiceType.Integration,
                RuntimePlatform = RuntimePlatform.Unknown,
                Purpose = "External REST façade for copilot clients with content-safety and rate policies.",
                Tags = ["edge", "gateway"],
                RequiredControls = ["ManagedTls", "WafBaseline"],
            },
            new()
            {
                ServiceId = svcOrchestrator,
                ServiceName = "Chat orchestration worker",
                ServiceType = ServiceType.Worker,
                RuntimePlatform = RuntimePlatform.ContainerApps,
                Purpose = "RAG retrieval, tool routing, and audit logging for workforce copilot sessions.",
                Tags = ["orchestration"],
                RequiredControls = ["ManagedIdentity"],
            },
            new()
            {
                ServiceId = svcSearch,
                ServiceName = "Azure AI Search retrieval",
                ServiceType = ServiceType.AiService,
                RuntimePlatform = RuntimePlatform.Unknown,
                Purpose = "Hybrid vector + semantic retrieval over redacted corporate document corpus.",
                Tags = ["rag"],
                RequiredControls = ["PrivateLink"],
            },
            new()
            {
                ServiceId = svcAoai,
                ServiceName = "Azure OpenAI completions",
                ServiceType = ServiceType.AiService,
                RuntimePlatform = RuntimePlatform.AzureOpenAi,
                Purpose = "Policy-gated chat completion and embedding endpoints.",
                Tags = ["ai-plane"],
                RequiredControls = ["PrivateLink", "ContentSafety"],
            },
        ];

        List<ManifestDatastore> datastores =
        [
            new()
            {
                DatastoreId = searchIndex,
                DatastoreName = "Corporate docs vector index",
                DatastoreType = DatastoreType.Search,
                RuntimePlatform = RuntimePlatform.Unknown,
                Purpose = "Synthetic document embeddings with classification tags — no customer PHI.",
            },
            new()
            {
                DatastoreId = kvSecrets,
                DatastoreName = "Key Vault — platform secrets",
                DatastoreType = DatastoreType.Unknown,
                RuntimePlatform = RuntimePlatform.KeyVault,
                Purpose = "Secrets bridge for search keys and Foundry-managed credentials.",
            },
        ];

        List<ManifestRelationship> relationships =
        [
            new()
            {
                RelationshipId = $"rel-{svcApim}-calls-{svcOrchestrator}",
                SourceId = svcApim,
                TargetId = svcOrchestrator,
                RelationshipType = RelationshipType.Calls,
                Description = "Copilot clients invoke orchestration through APIM policies.",
            },
            new()
            {
                RelationshipId = $"rel-{svcOrchestrator}-reads-{svcSearch}",
                SourceId = svcOrchestrator,
                TargetId = svcSearch,
                RelationshipType = RelationshipType.ReadsFrom,
                Description = "Orchestrator retrieves grounded chunks before completion.",
            },
            new()
            {
                RelationshipId = $"rel-{svcOrchestrator}-calls-{svcAoai}",
                SourceId = svcOrchestrator,
                TargetId = svcAoai,
                RelationshipType = RelationshipType.Calls,
                Description = "Completions routed through private egress to Azure OpenAI.",
            },
            new()
            {
                RelationshipId = $"rel-{svcSearch}-writes-{searchIndex}",
                SourceId = svcSearch,
                TargetId = searchIndex,
                RelationshipType = RelationshipType.WritesTo,
                Description = "Embedding pipeline refreshes vector index partitions.",
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
                ChangeDescription =
                    "Synthetic Enterprise Copilot RAG platform — born-governed created architecture package from guided intake.",
                DecisionTraceIds = [],
                CreatedUtc = SeedUtc,
            },
        };
    }
}
