using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Core.AgentSimulation;

public static partial class FakeScenarioFactory
{
    public static AgentResult CreateCostResult(
        string runId,
        string taskId,
        ArchitectureRequest request)
    {
        return new AgentResult
        {
            ResultId = StableHexId(runId, taskId, "cost-result"),
            TaskId = taskId,
            RunId = runId,
            AgentType = AgentType.Cost,
            Claims =
            [
                "App Service is lower operational overhead than AKS for initial delivery.",
                "Azure AI Search should be monitored as corpus size grows.",
                "Managed services reduce support burden."
            ],
            EvidenceRefs =
            [
                "request",
                "pricing-profile"
            ],
            Confidence = 0.82,
            Findings =
            [
                new ArchitectureFinding
                {
                    FindingId = StableHexId(runId, taskId, "cost-finding-0"),
                    SourceAgent = AgentType.Cost,
                    Severity = FindingSeverity.Info,
                    Category = "Cost",
                    Message = "Managed services selected for predictable operational cost.",
                    EvidenceRefs = ["pricing-profile"]
                }
            ],
            ProposedChanges = new AgentTopologyProposal
            {
                ProposalId = StableHexId(runId, taskId, "cost-proposal"),
                SourceAgent = AgentType.Cost,
                Warnings =
                [
                    "Search and token usage should be tracked from day one."
                ]
            },
            RetrievalGroundingTrace = new AgentResultRetrievalGroundingTrace { CitationCoverage = 1.0 },
            CreatedUtc = SimulatorSyntheticCreatedUtc
        };
    }
}
