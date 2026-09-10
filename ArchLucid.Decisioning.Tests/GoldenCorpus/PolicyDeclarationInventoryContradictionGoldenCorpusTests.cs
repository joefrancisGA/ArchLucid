using ArchLucid.Application.Findings;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Core.Configuration;
using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>
///     DX-36 sibling: proves three-way policy-declaration-inventory contradiction on the case-37 graph +
///     pinned inventory fixture with a filtered assigned pack (cis-az-006). Merge harness uses the default
///     unfiltered pack — sibling test only, mirroring WK-22 policy-filtered declaration tests.
/// </summary>
[Trait("Suite", "Core")]
public sealed class PolicyDeclarationInventoryContradictionGoldenCorpusTests
{
    private const string CisAzurePublicAccessRuleId = "cis-az-006";

    [Fact]
    public async Task Case37_graph_with_filtered_pack_emits_policy_declaration_inventory_contradiction()
    {
        GraphSnapshot graph = GoldenCorpusInventoryContradictionGraphFactory.CreateDeclarationDisabledInventoryEnabledGraph();
        GoldenCorpusInventoryFixtureDocument inventoryFixture =
            GoldenCorpusInventoryContradictionGraphFactory.CreateMismatchInventoryFixture();

        FakeTimeProvider clock = new();
        clock.SetUtcNow(new DateTimeOffset(2026, 2, 1, 0, 0, 0, TimeSpan.Zero));
        DateTime collectionUtc = clock.GetUtcNow().UtcDateTime;

        AzureExtractorPackageDownloadRecord download = GoldenCorpusEffectfulInventorySupport.CreateAzurePackage(
            inventoryFixture.AzurePackageId,
            inventoryFixture.ResourcesJson);

        Mock<IAzureExtractorPackageRepository> packageRepository =
            GoldenCorpusEffectfulInventorySupport.CreateSeededAzureRepository(
                GoldenCorpusFixedScopeContextProvider.Scope,
                download,
                collectionUtc);

        FindingAnalysisContext analysisContext = GoldenCorpusEffectfulInventorySupport.CreateAzurePinnedContext(
            graph.RunId,
            graph.ContextSnapshotId,
            inventoryFixture.AzurePackageId,
            collectionUtc);

        GoldenCorpusFixedScopeContextProvider scopeProvider = new();
        PolicyDeclarationInventoryContradictionFindingEngine engine = new(
            scopeProvider,
            packageRepository.Object,
            new NoOpCloudInventoryExtractorPackageRepository(),
            new FixedComplianceRulePackProvider(CreatePack(CisAzurePublicAccessRuleId)),
            clock,
            Options.Create(new RoiCostEvidenceFreshnessOptions { StaleAfterDays = 90 }));

        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(graph, analysisContext, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.EngineType.Should().Be("policy-declaration-inventory-contradiction");
        finding.PolicyRuleId.Should().Be(CisAzurePublicAccessRuleId);
        finding.Title.Should().Contain(CisAzurePublicAccessRuleId);
        finding.Title.Should().Contain("stpayprod");
        finding.Title.Should().Contain("Disabled");
        finding.Title.Should().Contain("Enabled");
        finding.Trace.Notes.Should().Contain($"evidence:inventory:{GoldenCorpusInventoryContradictionGraphFactory.StorageArmId}");
        finding.Trace.Notes.Should().Contain("evidence:graph-node:storage-1");
        finding.Trace.Notes.Should().Contain($"evidence:policy:{CisAzurePublicAccessRuleId}");

        PolicyDeclarationInventoryContradictionFindingPayload payload =
            finding.Payload.Should().BeOfType<PolicyDeclarationInventoryContradictionFindingPayload>().Subject;

        payload.PolicyRuleId.Should().Be(CisAzurePublicAccessRuleId);
        payload.DeclarationKey.Should().Be("tf.public_network_access");
        payload.DeclaredValue.Should().Be("Disabled");
        payload.InventoryValue.Should().Be("Enabled");
    }

    [Fact]
    public async Task Case37_graph_with_unmapped_pack_rule_emits_none()
    {
        GraphSnapshot graph = GoldenCorpusInventoryContradictionGraphFactory.CreateDeclarationDisabledInventoryEnabledGraph();
        GoldenCorpusInventoryFixtureDocument inventoryFixture =
            GoldenCorpusInventoryContradictionGraphFactory.CreateMismatchInventoryFixture();

        FakeTimeProvider clock = new();
        clock.SetUtcNow(new DateTimeOffset(2026, 2, 1, 0, 0, 0, TimeSpan.Zero));
        DateTime collectionUtc = clock.GetUtcNow().UtcDateTime;

        AzureExtractorPackageDownloadRecord download = GoldenCorpusEffectfulInventorySupport.CreateAzurePackage(
            inventoryFixture.AzurePackageId,
            inventoryFixture.ResourcesJson);

        Mock<IAzureExtractorPackageRepository> packageRepository =
            GoldenCorpusEffectfulInventorySupport.CreateSeededAzureRepository(
                GoldenCorpusFixedScopeContextProvider.Scope,
                download,
                collectionUtc);

        FindingAnalysisContext analysisContext = GoldenCorpusEffectfulInventorySupport.CreateAzurePinnedContext(
            graph.RunId,
            graph.ContextSnapshotId,
            inventoryFixture.AzurePackageId,
            collectionUtc);

        GoldenCorpusFixedScopeContextProvider scopeProvider = new();
        PolicyDeclarationInventoryContradictionFindingEngine engine = new(
            scopeProvider,
            packageRepository.Object,
            new NoOpCloudInventoryExtractorPackageRepository(),
            new FixedComplianceRulePackProvider(CreatePack("cost-opt-001")),
            clock,
            Options.Create(new RoiCostEvidenceFreshnessOptions { StaleAfterDays = 90 }));

        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(graph, analysisContext, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    private static ComplianceRulePack CreatePack(params string[] ruleIds) =>
        new()
        {
            RulePackId = "policy-declaration-inventory-golden-test",
            Name = "Policy declaration inventory golden test",
            Version = "1",
            Rules = ruleIds
                .Select(
                    static ruleId => new ComplianceRule
                    {
                        RuleId = ruleId,
                        ControlId = "c",
                        ControlName = "n",
                        AppliesToCategory = "cat",
                        RequiredNodeType = "t",
                        RequiredEdgeType = "e",
                        Description = "d",
                    })
                .ToList(),
        };
}
