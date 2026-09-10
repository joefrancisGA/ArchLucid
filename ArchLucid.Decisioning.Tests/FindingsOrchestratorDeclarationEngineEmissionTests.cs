using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Configuration;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Services;
using ArchLucid.Decisioning.Tests.GoldenCorpus;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Decisioning.Tests;

/// <summary>
///     QR-06 production check: declaration-security-baseline rows with product-shaped ARM
///     citations must stay in <see cref="FindingsSnapshot.Findings" /> after the density gate.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingsOrchestratorDeclarationEngineEmissionTests
{
    private const string AzureStorageArmId =
        "/subscriptions/00000000-0000-0000-0000-000000000001/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/docs";

    [Fact]
    public async Task GenerateFindingsSnapshotAsync_keeps_arm_cited_declaration_finding_in_findings_band()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "obj-storage",
                    NodeType = "TopologyResource",
                    Label = "docs",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["tf.public_network_access"] = "enabled",
                        ["azureResourceId"] = AzureStorageArmId,
                    },
                },
            ],
        };

        DeclarationSecurityBaselineFindingEngine engine = new(
            new FixedComplianceRulePackProvider(CreateFailOpenPolicyPack()));

        Mock<IFindingPayloadValidator> validator = new();
        validator.Setup(v => v.Validate(It.IsAny<Finding>()));

        FindingsOrchestrator sut = FindingsOrchestratorComposer.Compose(
            [engine],
            validator.Object,
            Options.Create(new HumanReviewFindingOptions()),
            DeterministicInsightDensityGate.CreateDefault());

        FindingsSnapshot snapshot = await sut.GenerateFindingsSnapshotAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            graph,
            CancellationToken.None);

        Finding emitted = snapshot.Findings.Should()
            .ContainSingle(finding => finding.EngineType == "declaration-security-baseline")
            .Subject;

        emitted.Classification.Should().NotBe(FindingClassification.ChecklistCoverage);
        GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation(emitted.EvidenceRefs).Should().BeTrue();
    }

    private static ComplianceRulePack CreateFailOpenPolicyPack() =>
        new()
        {
            RulePackId = "test-pack",
            Name = "Test",
            Version = "1",
            Rules =
            [
                new ComplianceRule
                {
                    RuleId = "cost-opt-001",
                    ControlId = "c",
                    ControlName = "n",
                    AppliesToCategory = "cat",
                    RequiredNodeType = "t",
                    RequiredEdgeType = "e",
                    Description = "d",
                },
            ],
        };
}
