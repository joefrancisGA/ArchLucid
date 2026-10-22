using System.Text.Json;

using ArchLucid.ArtifactSynthesis.Generators;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryArtifactGeneratorTests
{
    [Fact]
    public async Task GenerateAsync_serializes_requirements_security_compliance_and_issues()
    {
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Requirements = new RequirementsCoverageSection
            {
                Covered =
                [
                    new RequirementCoverageItem
                    {
                        RequirementName = "R1",
                        CoverageStatus = "Met",
                        RequirementText = "text",
                    },
                ],
                Uncovered =
                [
                    new RequirementCoverageItem
                    {
                        RequirementName = "R2",
                        CoverageStatus = "Gap",
                        RequirementText = "gap",
                    },
                ],
            },
            Security = new SecuritySection
            {
                Controls =
                [
                    new SecurityPostureItem
                    {
                        ControlName = "SC1",
                        Status = "Ok",
                        Impact = "low",
                    },
                ],
            },
            Compliance = new ComplianceSection
            {
                Controls =
                [
                    new CompliancePostureItem
                    {
                        ControlName = "CC1",
                        Status = "Pass",
                        AppliesToCategory = "net",
                    },
                ],
            },
            UnresolvedIssues = new UnresolvedIssuesSection
            {
                Items =
                [
                    new ManifestIssue
                    {
                        Title = "Issue1",
                        Severity = "High",
                        Description = "desc",
                    },
                ],
            },
        };

        InventoryArtifactGenerator sut = new();

        SynthesizedArtifact artifact = await sut.GenerateAsync(manifest, CancellationToken.None);

        artifact.ArtifactType.Should().Be(ArtifactType.Inventory);
        artifact.ContentHash.Should().NotBeNullOrWhiteSpace();

        using JsonDocument doc = JsonDocument.Parse(artifact.Content);
        JsonElement root = doc.RootElement;
        root.GetProperty("Items").GetArrayLength().Should().Be(5);
    }

    [Fact]
    public async Task GenerateAsync_serializes_mandatory_flag_for_requirement_items()
    {
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Requirements = new RequirementsCoverageSection
            {
                Covered =
                [
                    new RequirementCoverageItem
                    {
                        RequirementName = "Encrypt data at rest",
                        CoverageStatus = "Met",
                        RequirementText = "AES-256",
                        IsMandatory = true,
                    },
                ],
                Uncovered =
                [
                    new RequirementCoverageItem
                    {
                        RequirementName = "Disaster recovery region",
                        CoverageStatus = "Gap",
                        RequirementText = "secondary region",
                        IsMandatory = false,
                    },
                ],
            },
        };

        InventoryArtifactGenerator sut = new();

        SynthesizedArtifact artifact = await sut.GenerateAsync(manifest, CancellationToken.None);

        using JsonDocument doc = JsonDocument.Parse(artifact.Content);
        JsonElement items = doc.RootElement.GetProperty("Items");
        items.GetArrayLength().Should().Be(2);

        JsonElement covered = items[0];
        covered.GetProperty("Category").GetString().Should().Be("Requirement");
        covered.GetProperty("IsMandatory").GetBoolean().Should().BeTrue();

        JsonElement uncovered = items[1];
        uncovered.GetProperty("IsMandatory").GetBoolean().Should().BeFalse();
    }

    [Fact]
    public async Task GenerateAsync_serializes_issue_type_and_supporting_finding_ids_for_issue_items()
    {
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            UnresolvedIssues = new UnresolvedIssuesSection
            {
                Items =
                [
                    new ManifestIssue
                    {
                        IssueType = "Policy",
                        Title = "DR gap",
                        Severity = "High",
                        Description = "No warm standby.",
                        SupportingFindingIds = ["finding-dr-1"],
                    },
                ],
            },
        };

        InventoryArtifactGenerator sut = new();

        SynthesizedArtifact artifact = await sut.GenerateAsync(manifest, CancellationToken.None);

        using JsonDocument doc = JsonDocument.Parse(artifact.Content);
        JsonElement issue = doc.RootElement.GetProperty("Items")[0];
        issue.GetProperty("Category").GetString().Should().Be("Issue");
        issue.GetProperty("IssueType").GetString().Should().Be("Policy");
        issue.GetProperty("SupportingFindingIds").EnumerateArray()
            .Select(x => x.GetString())
            .Should().Equal("finding-dr-1");
    }

    [Fact]
    public async Task GenerateAsync_serializes_control_id_for_security_and_compliance_items_matching_compliance_matrix_export()
    {
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Security = new SecuritySection
            {
                Controls =
                [
                    new SecurityPostureItem
                    {
                        ControlId = "SC-7",
                        ControlName = "Boundary protection",
                        Status = "Met",
                        Impact = "High",
                    },
                ],
            },
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
            },
        };

        InventoryArtifactGenerator sut = new();

        SynthesizedArtifact artifact = await sut.GenerateAsync(manifest, CancellationToken.None);

        using JsonDocument doc = JsonDocument.Parse(artifact.Content);
        JsonElement items = doc.RootElement.GetProperty("Items");

        JsonElement security = items[0];
        security.GetProperty("Category").GetString().Should().Be("SecurityControl");
        security.GetProperty("ControlId").GetString().Should().Be("SC-7");

        JsonElement compliance = items[1];
        compliance.GetProperty("Category").GetString().Should().Be("ComplianceControl");
        compliance.GetProperty("ControlId").GetString().Should().Be("AC-2");
    }
}
