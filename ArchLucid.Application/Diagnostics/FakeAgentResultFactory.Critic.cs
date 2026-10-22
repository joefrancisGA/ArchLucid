using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;

namespace ArchLucid.Application.Diagnostics;

public static partial class FakeAgentResultFactory
{
    public static AgentResult CreateCriticResult(string runId, string taskId, ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentNullException.ThrowIfNull(taskId);
        ArgumentNullException.ThrowIfNull(request);
        return new AgentResult
        {
            ResultId = Guid.NewGuid().ToString("N"),
            TaskId = taskId,
            RunId = runId,
            AgentType = AgentType.Critic,
            Claims =
            [
                $"The proposed topology for '{request.SystemName}' uses well-understood Azure services with no obvious architectural anti-patterns.",
                "Cost estimate assumptions are reasonable for an MVP scope; revisit as load increases.",
                "Compliance controls are aligned with the stated policy baseline."
            ],
            EvidenceRefs = ["request", "policy-pack:enterprise-default", "policy-pack:azure-security-baseline", "service-catalog:azure-core-services"],
            Confidence = 0.85,
            Findings =
            [
                new ArchitectureFinding
                {
                    FindingId = Guid.NewGuid().ToString("N"),
                    SourceAgent = AgentType.Critic,
                    Severity = FindingSeverity.Info,
                    Category = "Review",
                    Message = "No critical omissions or contradictions detected in the proposed architecture.",
                    EvidenceRefs = ["request", "policy-pack:enterprise-default"]
                }
            ],
            ProposedChanges = new AgentTopologyProposal
            {
                ProposalId = Guid.NewGuid().ToString("N"),
                SourceAgent = AgentType.Critic,
                AddedServices = [],
                AddedDatastores = [],
                AddedRelationships = [],
                RequiredControls = [],
                Warnings = ["Ensure observability stack (Application Insights or equivalent) is included before production."]
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };
    }
}
