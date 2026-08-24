using ArchLucid.ArtifactSynthesis.Generators;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>
///     RC28e package-coverage batch: reference-architecture markdown and architecture narrative generators.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArtifactSynthesisPackageCoverageBatchRc28eTests
{
    [Fact]
    public async Task ReferenceArchitectureMarkdownGenerator_GenerateAsync_emits_topology_security_and_decisions()
    {
        Guid runId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid manifestId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        ManifestDocument manifest = new()
        {
            RunId = runId,
            ManifestId = manifestId,
            RuleSetId = "core-default",
            RuleSetVersion = "2026.08",
            ManifestHash = "hash-rc28e",
            Metadata = new ManifestMetadata
            {
                Name = "Orders Platform",
                Status = "Committed",
                Version = "3.1.0",
            },
            Requirements = new RequirementsCoverageSection
            {
                Covered = [new RequirementCoverageItem { RequirementName = "Encrypt data at rest" }],
                Uncovered = [new RequirementCoverageItem { RequirementName = "Disaster recovery region" }],
            },
            Topology = new TopologySection
            {
                SelectedPatterns = ["Hub-spoke"],
                Resources = ["orders-api", "orders-db"],
                Gaps = ["No secondary region"],
            },
            Security = new SecuritySection
            {
                Controls = [new SecurityPostureItem { ControlName = "Private Link", Status = "Implemented" }],
                Gaps = ["Missing WAF"],
            },
            Compliance = new ComplianceSection
            {
                Controls = [new CompliancePostureItem { ControlId = "AC-2", ControlName = "Account management", Status = "Partial" }],
                Gaps = ["Audit retention"],
            },
            Cost = new CostSection
            {
                MaxMonthlyCost = 1250.5m,
                CostRisks = ["Over-provisioned SKU"],
            },
            Decisions =
            [
                new ResolvedArchitectureDecision
                {
                    Category = "Security",
                    Title = "Prefer private endpoints",
                    SelectedOption = "Private Link",
                },
            ],
            UnresolvedIssues = new UnresolvedIssuesSection
            {
                Items = [new ManifestIssue { Severity = "High", Title = "DR gap", Description = "No warm standby." }],
            },
        };

        ReferenceArchitectureMarkdownGenerator generator = new();

        SynthesizedArtifact artifact = await generator.GenerateAsync(manifest, CancellationToken.None);

        artifact.ArtifactType.Should().Be(ArtifactType.ReferenceArchitectureMarkdown);
        artifact.Content.Should().Contain("# Reference Architecture - Orders Platform");
        artifact.Content.Should().Contain("- Pattern: Hub-spoke");
        artifact.Content.Should().Contain("- Private Link: Implemented");
        artifact.Content.Should().Contain("- AC-2 Account management: Partial");
        artifact.Content.Should().Contain("- Max Monthly Cost: 1250.50");
        artifact.Content.Should().Contain("Prefer private endpoints");
        artifact.Content.Should().Contain("[High] DR gap");
        artifact.ContentHash.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task ReferenceArchitectureMarkdownGenerator_GenerateAsync_emits_empty_section_placeholders()
    {
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            RuleSetId = "core-default",
            RuleSetVersion = "1",
            ManifestHash = "empty-hash",
            Metadata = new ManifestMetadata { Name = "Empty Manifest" },
        };

        ReferenceArchitectureMarkdownGenerator generator = new();

        SynthesizedArtifact artifact = await generator.GenerateAsync(manifest, CancellationToken.None);

        artifact.Content.Should().Contain("- No requirements recorded.");
        artifact.Content.Should().Contain("- No topology information recorded.");
        artifact.Content.Should().Contain("- No security posture recorded.");
        artifact.Content.Should().Contain("- No compliance posture recorded.");
        artifact.Content.Should().Contain("- Max Monthly Cost: Not specified");
        artifact.Content.Should().Contain("- No decisions recorded.");
        artifact.Content.Should().Contain("- No unresolved issues.");
    }

    [Fact]
    public async Task ReferenceArchitectureMarkdownGenerator_GenerateAsync_emits_committed_constraints_not_not_specified()
    {
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            RuleSetId = "core-default",
            RuleSetVersion = "1",
            ManifestHash = "constraints-hash",
            Metadata = new ManifestMetadata { Name = "Regional Retail" },
            Constraints = new ConstraintSection
            {
                MandatoryConstraints = ["Must stay in Canada Central"],
                Preferences = ["Prefer Azure-native services"],
            },
        };

        ReferenceArchitectureMarkdownGenerator generator = new();

        SynthesizedArtifact artifact = await generator.GenerateAsync(manifest, CancellationToken.None);

        artifact.Content.Should().Contain("- Mandatory: Must stay in Canada Central");
        artifact.Content.Should().Contain("- Preference: Prefer Azure-native services");
        artifact.Content.Should().NotContain("## Constraints\nNot specified.");
    }

    [Fact]
    public async Task ArchitectureNarrativeArtifactGenerator_GenerateAsync_emits_constraints_and_provenance()
    {
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Metadata = new ManifestMetadata
            {
                Name = "Retail Checkout",
                Summary = "Committed checkout modernization package.",
            },
            Requirements = new RequirementsCoverageSection
            {
                Covered = [new RequirementCoverageItem { RequirementName = "PCI boundary" }],
            },
            Topology = new TopologySection
            {
                Resources = ["checkout-api"],
                Gaps = ["No CDN edge"],
            },
            Security = new SecuritySection
            {
                Controls = [new SecurityPostureItem { ControlName = "TLS 1.2+", Status = "Required" }],
            },
            Compliance = new ComplianceSection
            {
                Controls = [new CompliancePostureItem { ControlId = "SC-7", ControlName = "Boundary protection", Status = "Met" }],
            },
            Cost = new CostSection { CostRisks = ["Idle dev/test capacity"] },
            Constraints = new ConstraintSection
            {
                MandatoryConstraints = ["Must stay in Canada Central"],
                Preferences = ["Prefer Azure-native services"],
            },
            UnresolvedIssues = new UnresolvedIssuesSection
            {
                Items = [new ManifestIssue { Severity = "Medium", Title = "CDN", Description = "Edge not selected." }],
            },
            Provenance = new ManifestProvenance
            {
                SourceFindingIds = ["finding-1", "finding-2"],
                SourceGraphNodeIds = ["node-a"],
                AppliedRuleIds = ["rule-1"],
            },
        };

        ArchitectureNarrativeArtifactGenerator generator = new();

        SynthesizedArtifact artifact = await generator.GenerateAsync(manifest, CancellationToken.None);

        artifact.ArtifactType.Should().Be(ArtifactType.ArchitectureNarrative);
        artifact.Content.Should().Contain("# Retail Checkout");
        artifact.Content.Should().Contain("Committed checkout modernization package.");
        artifact.Content.Should().Contain("- Mandatory: Must stay in Canada Central");
        artifact.Content.Should().Contain("- Preference: Prefer Azure-native services");
        artifact.Content.Should().Contain("- Applied Rules: 1");
        artifact.Content.Should().Contain("[Medium] CDN");
    }
}
