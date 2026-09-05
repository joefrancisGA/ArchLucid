using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Requests;

namespace ArchLucid.Core.AgentSimulation;

public static partial class FakeScenarioFactory
{
    public static AgentResult CreateComplianceResult(
        string runId,
        string taskId,
        ArchitectureRequest request)
    {
        List<string> requiredControls =
        [
            "Managed Identity",
            "Private Endpoints",
            "Key Vault"
        ];

        if (RequestConstraintClassifier.HasEncryptionConstraint(request))
            requiredControls.Add("Encryption At Rest");

        return new AgentResult
        {
            ResultId = StableHexId(runId, taskId, "compliance-result"),
            TaskId = taskId,
            RunId = runId,
            AgentType = AgentType.Compliance,
            Claims =
            [
                "Managed identity is required.",
                "Private endpoints are required for data-bearing services.",
                "Secrets should be stored in Key Vault."
            ],
            EvidenceRefs =
            [
                "policy-pack:enterprise-default",
                "policy-pack:azure-security-baseline"
            ],
            Confidence = 0.96,
            Findings =
            [
                new ArchitectureFinding
                {
                    FindingId = StableHexId(runId, taskId, "compliance-finding-0"),
                    SourceAgent = AgentType.Compliance,
                    Severity = FindingSeverity.Critical,
                    Category = "Compliance",
                    Message = "PrivateNetworkingRequired",
                    EvidenceRefs = ["policy-pack:enterprise-default"]
                },
                new ArchitectureFinding
                {
                    FindingId = StableHexId(runId, taskId, "compliance-finding-1"),
                    SourceAgent = AgentType.Compliance,
                    Severity = FindingSeverity.Critical,
                    Category = "Compliance",
                    Message = "ManagedIdentityRequired",
                    EvidenceRefs = ["policy-pack:azure-security-baseline"]
                }
            ],
            ProposedChanges = new AgentTopologyProposal
            {
                ProposalId = StableHexId(runId, taskId, "compliance-proposal"),
                SourceAgent = AgentType.Compliance,
                RequiredControls = requiredControls,
                Warnings =
                [
                    "Any public network access should require explicit exception review."
                ]
            },
            RetrievalGroundingTrace = new AgentResultRetrievalGroundingTrace { CitationCoverage = 1.0 },
            CreatedUtc = SimulatorSyntheticCreatedUtc
        };
    }
}
