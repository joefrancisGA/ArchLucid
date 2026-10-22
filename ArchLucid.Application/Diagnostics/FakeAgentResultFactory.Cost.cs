using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;

namespace ArchLucid.Application.Diagnostics;

public static partial class FakeAgentResultFactory
{
    public static AgentResult CreateCostResult(string runId, string taskId, ArchitectureRequest _)
    {
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentNullException.ThrowIfNull(taskId);
        ArgumentNullException.ThrowIfNull(_);
        return new AgentResult
        {
            ResultId = Guid.NewGuid().ToString("N"),
            TaskId = taskId,
            RunId = runId,
            AgentType = AgentType.Cost,
            Claims =
            [
                "App Service is likely a lower operational overhead option than AKS for the initial MVP.",
                "Azure AI Search cost should be monitored as index size and query volume increase.",
                "Managed platform choices reduce support burden at modest additional platform cost."
            ],
            EvidenceRefs = ["request", "pricing-profile", "service-catalog:azure-core-services"],
            Confidence = 0.79,
            Findings =
            [
                new ArchitectureFinding
                {
                    FindingId = Guid.NewGuid().ToString("N"),
                    SourceAgent = AgentType.Cost,
                    Severity = FindingSeverity.Info,
                    Category = "Cost",
                    Message = "App Service minimizes operational complexity for initial deployment.",
                    EvidenceRefs = ["pricing-profile"]
                }
            ],
            ProposedChanges = new AgentTopologyProposal
            {
                ProposalId = Guid.NewGuid().ToString("N"),
                SourceAgent = AgentType.Cost,
                AddedServices = [],
                AddedDatastores = [],
                AddedRelationships = [],
                RequiredControls = [],
                Warnings =
                [
                    "Search capacity and token usage should be tracked from the start.",
                    "Future high-scale growth may justify re-evaluating the hosting model."
                ]
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };
    }
}
