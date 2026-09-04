using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Core.AgentSimulation;

public static partial class FakeScenarioFactory
{
    public static AgentResult CreateTopologyResult(
        string runId,
        string taskId,
        ArchitectureRequest request)
    {
        return new AgentResult
        {
            ResultId = StableHexId(runId, taskId, "topology-result"),
            TaskId = taskId,
            RunId = runId,
            AgentType = AgentType.Topology,
            Claims =
            [
                $"Use App Service for the primary API for system '{request.SystemName}'.",
                "Use Azure AI Search for retrieval.",
                "Use SQL Server for metadata storage."
            ],
            EvidenceRefs =
            [
                "request",
                "catalog:azure-core-services",
                "catalog:azure-ai-search",
                "catalog:azure-sql"
            ],
            Confidence = 0.91,
            Findings =
            [
                new ArchitectureFinding
                {
                    FindingId = StableHexId(runId, taskId, "topology-finding-0"),
                    SourceAgent = AgentType.Topology,
                    Severity = FindingSeverity.Info,
                    Category = "Topology",
                    Message = "Simple managed-service topology selected for initial implementation.",
                    EvidenceRefs = ["request"]
                }
            ],
            ProposedChanges = new AgentTopologyProposal
            {
                ProposalId = StableHexId(runId, taskId, "topology-proposal"),
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceId = "svc-api",
                        ServiceName = "rag-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                        Purpose = "Primary API for RAG queries",
                        Tags = ["rag", "api"]
                    },
                    new ManifestService
                    {
                        ServiceId = "svc-search",
                        ServiceName = "rag-search",
                        ServiceType = ServiceType.SearchService,
                        RuntimePlatform = RuntimePlatform.AzureAiSearch,
                        Purpose = "Enterprise retrieval layer",
                        Tags = ["search", "retrieval"]
                    },
                    new ManifestService
                    {
                        ServiceId = "svc-openai",
                        ServiceName = "rag-openai",
                        ServiceType = ServiceType.AiService,
                        RuntimePlatform = RuntimePlatform.AzureOpenAi,
                        Purpose = "LLM inference service",
                        Tags = ["ai", "llm"]
                    }
                ],
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreId = "ds-meta",
                        DatastoreName = "rag-metadata",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer,
                        Purpose = "Stores metadata and citations",
                        EncryptionAtRestRequired = true
                    }
                ],
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        RelationshipId = "rel-api-search",
                        SourceId = "svc-api",
                        TargetId = "svc-search",
                        RelationshipType = RelationshipType.Calls,
                        Description = "API queries retrieval service"
                    },
                    new ManifestRelationship
                    {
                        RelationshipId = "rel-api-openai",
                        SourceId = "svc-api",
                        TargetId = "svc-openai",
                        RelationshipType = RelationshipType.Calls,
                        Description = "API sends prompts to LLM service"
                    },
                    new ManifestRelationship
                    {
                        RelationshipId = "rel-api-meta",
                        SourceId = "svc-api",
                        TargetId = "ds-meta",
                        RelationshipType = RelationshipType.WritesTo,
                        Description = "API writes metadata and citations"
                    }
                ],
                Warnings =
                [
                    "Topology is optimized for MVP simplicity."
                ]
            },
            RetrievalGroundingTrace = new AgentResultRetrievalGroundingTrace { CitationCoverage = 1.0 },
            CreatedUtc = SimulatorSyntheticCreatedUtc
        };
    }
}
