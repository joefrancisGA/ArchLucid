using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Core.AgentSimulation;

public static partial class FakeScenarioFactory
{
    public static AgentResult CreateCriticResult(
        string runId,
        string taskId,
        ArchitectureRequest request)
    {
        return new AgentResult
        {
            ResultId = StableHexId(runId, taskId, "critic-result"),
            TaskId = taskId,
            RunId = runId,
            AgentType = AgentType.Critic,
            Claims =
            [
                "No critical architecture contradictions detected in the starter pattern.",
                "Private networking and managed identity controls are necessary."
            ],
            EvidenceRefs =
            [
                "request",
                "critic-checklist"
            ],
            Confidence = 0.78,
            Findings =
            [
                new ArchitectureFinding
                {
                    FindingId = StableHexId(runId, taskId, "critic-finding-0"),
                    SourceAgent = AgentType.Critic,
                    Severity = FindingSeverity.Info,
                    Category = "Critic",
                    Message = "Starter architecture is coherent for an MVP.",
                    EvidenceRefs = ["critic-checklist"]
                }
            ],
            ProposedChanges = new AgentTopologyProposal
            {
                ProposalId = StableHexId(runId, taskId, "critic-proposal"),
                SourceAgent = AgentType.Critic,
                Warnings =
                [
                    "Future growth may justify revisiting hosting and indexing topology."
                ]
            },
            RetrievalGroundingTrace = new AgentResultRetrievalGroundingTrace { CitationCoverage = 1.0 },
            CreatedUtc = SimulatorSyntheticCreatedUtc
        };
    }
}
