using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Decisioning.Merge;
using ArchLucid.Decisioning.Validation;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.Decisioning.Tests.Merge;

[Trait("Category", "Unit")]
public sealed class DecisionEngineServiceQuadAgentSchemaMergeTests
{
    [Fact]
    public void MergeResults_quadAgentWireShape_passesStrictAgentResultSchemaValidation()
    {
        const string runId = "RUN-QUAD-LIVE-WIRE";

        ArchitectureRequest request = new()
        {
            RequestId = "REQ-QUAD",
            SystemName = "ContosoRetailWeb",
            Description = "Three-tier Azure web + SQL + Redis",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            RequiredCapabilities = ["Managed Identity", "Private Networking"]
        };

        AgentResult topology = CreateTopologyResult(runId);
        AgentResult compliance = CreateComplianceResult(runId);
        AgentResult cost = CreateCostResult(runId);
        AgentResult critic = CreateCriticResult(runId);

        SchemaValidationService validationService = new(
            NullLogger<SchemaValidationService>.Instance,
            Options.Create(new SchemaValidationOptions()));

        DecisionEngineService engine = new(validationService);

        DecisionMergeResult merge = engine.MergeResults(
            runId,
            request,
            "v1",
            [topology, compliance, cost, critic],
            [],
            []);

        merge.Success.Should().BeTrue("merge errors: {0}", string.Join("; ", merge.Errors));
        merge.Manifest.Services.Count.Should().BeGreaterThan(0);
        merge.DecisionTraces.Count.Should().BeGreaterThan(0);
    }

    [Fact]
    public void ArchitectureFindingJsonConverter_mapsDescriptionAndLegacySeverity()
    {
        const string json = """
                            {
                              "severity": "High",
                              "category": "Compliance",
                              "description": "Private endpoints required.",
                              "recommendation": "Enable PE on SQL."
                            }
                            """;

        JsonSerializerOptions options = new(JsonSerializerDefaults.Web)
        {
            Converters = { new ArchitectureFindingJsonConverter() }
        };

        ArchitectureFinding? finding = JsonSerializer.Deserialize<ArchitectureFinding>(json, options);

        finding.Should().NotBeNull();
        finding!.Severity.Should().Be(FindingSeverity.Error);
        finding.Message.Should().Be("Private endpoints required.");
    }

    private static AgentResult CreateTopologyResult(string runId)
    {
        return new AgentResult
        {
            ResultId = "RES-TOPO-LIVE",
            TaskId = "TASK-TOPO",
            RunId = runId,
            AgentType = AgentType.Topology,
            Claims = ["Web tier on App Service with Redis cache and Azure SQL backend."],
            EvidenceRefs = ["three-tier-web-pattern"],
            Confidence = 0.88,
            ProposedChanges = new AgentTopologyProposal
            {
                ProposalId = "PROP-TOPO",
                SourceAgent = AgentType.Topology,
                AddedServices =
                [
                    new()
                    {
                        ServiceId = "web",
                        ServiceName = "contoso-web",
                        ServiceType = ServiceType.Ui,
                        RuntimePlatform = RuntimePlatform.AppService
                    }
                ],
                AddedDatastores =
                [
                    new()
                    {
                        DatastoreId = "sql",
                        DatastoreName = "contoso-sql",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer
                    }
                ]
            }
        };
    }

    private static AgentResult CreateComplianceResult(string runId)
    {
        return new AgentResult
        {
            ResultId = "RES-COMP-LIVE",
            TaskId = "TASK-COMP",
            RunId = runId,
            AgentType = AgentType.Compliance,
            Claims = ["Managed identity and private endpoints required."],
            EvidenceRefs = ["policy-pack"],
            Confidence = 0.9,
            Findings =
            [
                new ArchitectureFinding
                {
                    Severity = FindingSeverity.Error,
                    Category = "Compliance",
                    Message = "PrivateNetworkingRequired"
                }
            ],
            ProposedChanges = new AgentTopologyProposal
            {
                ProposalId = "PROP-COMP",
                SourceAgent = AgentType.Compliance,
                RequiredControls = ["Managed Identity", "Private Endpoints", "Key Vault"]
            }
        };
    }

    private static AgentResult CreateCostResult(string runId)
    {
        return new AgentResult
        {
            ResultId = "RES-COST-LIVE",
            TaskId = "TASK-COST",
            RunId = runId,
            AgentType = AgentType.Cost,
            Claims = ["Right-size App Service SKU for pilot traffic."],
            EvidenceRefs = ["cost-model"],
            Confidence = 0.82,
            ProposedChanges = new AgentTopologyProposal
            {
                ProposalId = "PROP-COST",
                SourceAgent = AgentType.Cost,
                Warnings = ["Consider reserved capacity after steady-state usage is observed."]
            }
        };
    }

    private static AgentResult CreateCriticResult(string runId)
    {
        return new AgentResult
        {
            ResultId = "RES-CRIT-LIVE",
            TaskId = "TASK-CRIT",
            RunId = runId,
            AgentType = AgentType.Critic,
            Claims = ["Document DR validation before production cutover."],
            EvidenceRefs = ["peer-review-rubric"],
            Confidence = 0.75,
            Findings =
            [
                new ArchitectureFinding
                {
                    Severity = FindingSeverity.Warning,
                    Category = "Critic",
                    Message = "DR evidence missing from sponsor packet."
                }
            ],
            ProposedChanges = new AgentTopologyProposal
            {
                ProposalId = "PROP-CRIT",
                SourceAgent = AgentType.Critic,
                RequiredControls = ["Diagnostic Logging"]
            }
        };
    }
}
