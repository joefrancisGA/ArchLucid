using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;

namespace ArchLucid.Application.Diagnostics;

public static partial class FakeAgentResultFactory
{
    public static AgentResult CreateComplianceResult(string runId, string taskId, ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentNullException.ThrowIfNull(taskId);
        ArgumentNullException.ThrowIfNull(request);
        List<string> requiredControls = ["Managed Identity", "Key Vault", "Private Endpoints"];
        if (!request.RequiredCapabilities.Any(x => x.Contains("private", StringComparison.OrdinalIgnoreCase)))
            return new AgentResult
            {
                ResultId = Guid.NewGuid().ToString("N"),
                TaskId = taskId,
                RunId = runId,
                AgentType = AgentType.Compliance,
                Claims =
                [
                    "Managed identity is required for service-to-service authentication.", "Private endpoints are required for data-bearing services.",
                    "Secrets should be externalized into Key Vault."
                ],
                EvidenceRefs = ["request", "policy-pack:enterprise-default", "policy-pack:azure-security-baseline"],
                Confidence = 0.96,
                Findings =
                [
                    new ArchitectureFinding
                    {
                        FindingId = Guid.NewGuid().ToString("N"),
                        SourceAgent = AgentType.Compliance,
                        Severity = FindingSeverity.Critical,
                        Category = "Compliance",
                        Message = "PrivateNetworkingRequired",
                        EvidenceRefs = ["policy-pack:enterprise-default"]
                    },
                    new ArchitectureFinding
                    {
                        FindingId = Guid.NewGuid().ToString("N"),
                        SourceAgent = AgentType.Compliance,
                        Severity = FindingSeverity.Critical,
                        Category = "Compliance",
                        Message = "ManagedIdentityRequired",
                        EvidenceRefs = ["policy-pack:azure-security-baseline"]
                    }
                ],
                ProposedChanges = new AgentTopologyProposal
                {
                    ProposalId = Guid.NewGuid().ToString("N"),
                    SourceAgent = AgentType.Compliance,
                    AddedServices = [],
                    AddedDatastores = [],
                    AddedRelationships = [],
                    RequiredControls = requiredControls,
                    Warnings = ["Any public network exposure should be treated as an exception requiring explicit review."]
                },
                CreatedUtc = TimeProvider.System.UtcNowDateTime()
            };
        if (!requiredControls.Contains("Private Networking", StringComparer.OrdinalIgnoreCase))
            requiredControls.Add("Private Networking");
        return new AgentResult
        {
            ResultId = Guid.NewGuid().ToString("N"),
            TaskId = taskId,
            RunId = runId,
            AgentType = AgentType.Compliance,
            Claims =
            [
                "Managed identity is required for service-to-service authentication.", "Private endpoints are required for data-bearing services.",
                "Secrets should be externalized into Key Vault."
            ],
            EvidenceRefs = ["request", "policy-pack:enterprise-default", "policy-pack:azure-security-baseline"],
            Confidence = 0.96,
            Findings =
            [
                new ArchitectureFinding
                {
                    FindingId = Guid.NewGuid().ToString("N"),
                    SourceAgent = AgentType.Compliance,
                    Severity = FindingSeverity.Critical,
                    Category = "Compliance",
                    Message = "PrivateNetworkingRequired",
                    EvidenceRefs = ["policy-pack:enterprise-default"]
                },
                new ArchitectureFinding
                {
                    FindingId = Guid.NewGuid().ToString("N"),
                    SourceAgent = AgentType.Compliance,
                    Severity = FindingSeverity.Critical,
                    Category = "Compliance",
                    Message = "ManagedIdentityRequired",
                    EvidenceRefs = ["policy-pack:azure-security-baseline"]
                }
            ],
            ProposedChanges = new AgentTopologyProposal
            {
                ProposalId = Guid.NewGuid().ToString("N"),
                SourceAgent = AgentType.Compliance,
                AddedServices = [],
                AddedDatastores = [],
                AddedRelationships = [],
                RequiredControls = requiredControls,
                Warnings = ["Any public network exposure should be treated as an exception requiring explicit review."]
            },
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };
    }
}
