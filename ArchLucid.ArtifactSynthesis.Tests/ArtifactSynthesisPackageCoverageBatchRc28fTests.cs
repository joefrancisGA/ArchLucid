using System.Text.Json;

using ArchLucid.ArtifactSynthesis.Generators;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Costing;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;

using FluentAssertions;

using Moq;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>
///     RC28f package-coverage batch: cost-summary augmentation wiring and empty-vs-populated issue/compliance artifacts.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArtifactSynthesisPackageCoverageBatchRc28fTests
{
    [Fact]
    public async Task CostSummaryArtifactGenerator_GenerateAsync_merges_augmentation_provider_output()
    {
        Guid runId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid manifestId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        ManifestDocument manifest = new()
        {
            RunId = runId,
            ManifestId = manifestId,
            Cost = new CostSection
            {
                MaxMonthlyCost = 500m,
                CostRisks = ["Over-provisioned SKU"],
                Notes = ["Illustrative only"],
            },
            Topology = new TopologySection
            {
                Services =
                [
                    new ManifestService
                    {
                        ServiceId = "svc-api",
                        ServiceName = "Orders API",
                        RuntimePlatform = RuntimePlatform.AppService,
                    },
                ],
            },
        };

        InfrastructureCostArtifactAugmentation augmentation = new(
            InferredUsdPerMonth: 275.5m,
            Lines:
            [
                new InfrastructureCostLine(
                    "Service",
                    "Orders API",
                    RuntimePlatform.AppService,
                    "Azure App Service",
                    275.5m,
                    InfrastructureCostPriceSource.RetailApi),
            ],
            SummaryNote: "Retail estimate from topology.");

        Mock<IInfrastructureCostArtifactAugmentationProvider> provider = new();
        provider
            .Setup(p => p.AugmentNodesAsync(It.IsAny<IReadOnlyList<InfrastructureCostQueryNode>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(augmentation);

        CostSummaryArtifactGenerator generator = new(provider.Object);

        SynthesizedArtifact artifact = await generator.GenerateAsync(manifest, CancellationToken.None);

        artifact.ArtifactType.Should().Be(ArtifactType.CostSummary);
        artifact.RunId.Should().Be(runId);
        artifact.ManifestId.Should().Be(manifestId);
        artifact.ContentHash.Should().NotBeNullOrWhiteSpace();

        using JsonDocument doc = JsonDocument.Parse(artifact.Content);
        doc.RootElement.GetProperty("MaxMonthlyCost").GetDecimal().Should().Be(500m);
        doc.RootElement.GetProperty("TopologyInferredInfrastructureUsdPerMonth").GetDecimal().Should().Be(275.5m);
        doc.RootElement.GetProperty("InfrastructureLines")[0].GetProperty("DisplayName").GetString()
            .Should().Be("Orders API");
    }

    [Fact]
    public async Task UnresolvedIssuesArtifactGenerator_GenerateAsync_emits_empty_items_array()
    {
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            UnresolvedIssues = new UnresolvedIssuesSection(),
        };

        UnresolvedIssuesArtifactGenerator generator = new();

        SynthesizedArtifact artifact = await generator.GenerateAsync(manifest, CancellationToken.None);

        using JsonDocument doc = JsonDocument.Parse(artifact.Content);
        doc.RootElement.GetProperty("Items").GetArrayLength().Should().Be(0);
    }

    [Fact]
    public async Task ComplianceMatrixArtifactGenerator_GenerateAsync_maps_controls_and_gap_notes()
    {
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Compliance = new ComplianceSection
            {
                Controls =
                [
                    new CompliancePostureItem
                    {
                        ControlId = "AC-2",
                        ControlName = "Account management",
                        AppliesToCategory = "Identity",
                        Status = "Partial",
                    },
                ],
                Gaps = ["Account management retention gap"],
            },
        };

        ComplianceMatrixArtifactGenerator generator = new();

        SynthesizedArtifact artifact = await generator.GenerateAsync(manifest, CancellationToken.None);

        using JsonDocument doc = JsonDocument.Parse(artifact.Content);
        JsonElement row = doc.RootElement.GetProperty("Rows")[0];
        row.GetProperty("ControlId").GetString().Should().Be("AC-2");
        row.GetProperty("Notes").GetString().Should().Contain("Account management");
    }
}
