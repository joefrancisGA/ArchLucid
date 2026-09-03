using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;

namespace ArchLucid.Application.Diagnostics;

public static partial class FakeAgentResultFactory
{
    public static AgentResult CreateTopologyResult(string runId, string taskId, ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentNullException.ThrowIfNull(taskId);
        ArgumentNullException.ThrowIfNull(request);
        return new AgentResult
        {
            ResultId = Guid.NewGuid().ToString("N"),
            TaskId = taskId,
            RunId = runId,
            AgentType = AgentType.Topology,
            Claims =
            [
                $"Use App Service for the primary API for system '{request.SystemName}'.", "Use Azure AI Search for enterprise retrieval.",
                "Use SQL Server for metadata storage."
            ],
            EvidenceRefs = ["request", "service-catalog:azure-core-services", "service-catalog:azure-ai-search", "service-catalog:azure-sql"],
            Confidence = 0.91,
            Findings =
            [
                new ArchitectureFinding
                {
                    FindingId = Guid.NewGuid().ToString("N"),
                    SourceAgent = AgentType.Topology,
                    Severity = FindingSeverity.Info,
                    Category = "Topology",
                    Message = "A simple App Service-based topology is appropriate for the initial implementation.",
                    EvidenceRefs = ["request"]
                }
            ],
            ProposedChanges = new AgentTopologyProposal
            {
                ProposalId = Guid.NewGuid().ToString("N"),
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceId = "svc-api",
                        ServiceName = "rag-api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                        Purpose = "Primary application API for retrieval-augmented generation requests",
                        Tags = ["rag", "api", "entrypoint"]
                    },
                    new ManifestService
                    {
                        ServiceId = "svc-search",
                        ServiceName = "rag-search",
                        ServiceType = ServiceType.SearchService,
                        RuntimePlatform = RuntimePlatform.AzureAiSearch,
                        Purpose = "Enterprise search and retrieval layer",
                        Tags = ["search", "retrieval", "index"]
                    },
                    new ManifestService
                    {
                        ServiceId = "svc-openai",
                        ServiceName = "rag-openai",
                        ServiceType = ServiceType.AiService,
                        RuntimePlatform = RuntimePlatform.AzureOpenAi,
                        Purpose = "LLM inference for summarization and response generation",
                        Tags = ["ai", "llm", "generation"]
                    }
                ],
                AddedDatastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreId = "ds-metadata",
                        DatastoreName = "rag-metadata",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer,
                        Purpose = "Stores document metadata, citations, and run metadata",
                        PrivateEndpointRequired = false,
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
                        Description = "API sends retrieval queries to search"
                    },
                    new ManifestRelationship
                    {
                        RelationshipId = "rel-api-openai",
                        SourceId = "svc-api",
                        TargetId = "svc-openai",
                        RelationshipType = RelationshipType.Calls,
                        Description = "API invokes LLM completions"
                    },
                    new ManifestRelationship
                    {
                        RelationshipId = "rel-api-metadata",
                        SourceId = "svc-api",
                        TargetId = "ds-metadata",
                        RelationshipType = RelationshipType.WritesTo,
                        Description = "API writes metadata and usage records"
                    }
                ],
                RequiredControls = [],
                Warnings = ["Topology intentionally favors implementation simplicity over maximum future extensibility."]
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };
    }
}
