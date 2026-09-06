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
        List<string> requiredControls = ["Key Vault"];

        if (RequestConstraintClassifier.HasManagedIdentityConstraint(request))
            requiredControls.Add("Managed Identity");

        if (RequestConstraintClassifier.HasPrivateNetworkingConstraint(request))
            requiredControls.Add("Private Endpoints");

        if (RequestConstraintClassifier.HasEncryptionConstraint(request))
            requiredControls.Add("Encryption At Rest");

        List<string> claims = ["Secrets should be stored in Key Vault."];

        if (RequestConstraintClassifier.HasManagedIdentityConstraint(request))
            claims.Insert(0, "Managed identity is required.");

        if (RequestConstraintClassifier.HasPrivateNetworkingConstraint(request))
            claims.Insert(
                RequestConstraintClassifier.HasManagedIdentityConstraint(request) ? 1 : 0,
                "Private endpoints are required for data-bearing services.");

        List<ArchitectureFinding> findings = [];

        if (RequestConstraintClassifier.HasPrivateNetworkingConstraint(request))
        {
            findings.Add(new ArchitectureFinding
            {
                FindingId = StableHexId(runId, taskId, "compliance-finding-0"),
                SourceAgent = AgentType.Compliance,
                Severity = FindingSeverity.Critical,
                Category = "Compliance",
                Message = "PrivateNetworkingRequired",
                EvidenceRefs = ["policy-pack:enterprise-default"]
            });
        }

        if (RequestConstraintClassifier.HasManagedIdentityConstraint(request))
        {
            findings.Add(new ArchitectureFinding
            {
                FindingId = StableHexId(runId, taskId, "compliance-finding-1"),
                SourceAgent = AgentType.Compliance,
                Severity = FindingSeverity.Critical,
                Category = "Compliance",
                Message = "ManagedIdentityRequired",
                EvidenceRefs = ["policy-pack:azure-security-baseline"]
            });
        }

        return new AgentResult
        {
            ResultId = StableHexId(runId, taskId, "compliance-result"),
            TaskId = taskId,
            RunId = runId,
            AgentType = AgentType.Compliance,
            Claims = claims,
            EvidenceRefs =
            [
                "policy-pack:enterprise-default",
                "policy-pack:azure-security-baseline"
            ],
            Confidence = 0.96,
            Findings = findings,
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
