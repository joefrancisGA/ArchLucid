using ArchLucid.ArtifactSynthesis.Classifiers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.ArtifactSynthesis.Validation;
using ArchLucid.Core.Terraform;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>
///     RC26 package-coverage batch: orphan-resource classification rules, the regex Terraform fallback validator, and
///     the artifact metadata paging records.
/// </summary>
[Trait("Category", "Unit")]
public sealed class ArtifactSynthesisPackageCoverageBatchRc26Tests
{
    [Fact]
    public void OrphanedResourceClassifier_rejects_blank_input()
    {
        FluentActions
            .Invoking(() => OrphanedResourceClassifier.ClassifyFromResourcesJson("   "))
            .Should()
            .Throw<ArgumentException>();
    }

    [Fact]
    public void OrphanedResourceClassifier_returns_empty_for_non_array_root()
    {
        IReadOnlyList<OrphanedResourceFinding> findings =
            OrphanedResourceClassifier.ClassifyFromResourcesJson("""{ "resourceType": "Microsoft.Compute/disks" }""");

        findings.Should().BeEmpty();
    }

    [Theory]
    [InlineData("""[{ "resourceId": "/subscriptions/x/disks/d1" }]""")]
    [InlineData("""[{ "resourceType": "Microsoft.Compute/disks", "resourceId": "   " }]""")]
    [InlineData("""[{ "resourceType": "Microsoft.Sql/servers", "resourceId": "/subscriptions/x/servers/s1" }]""")]
    public void OrphanedResourceClassifier_skips_rows_it_cannot_classify(string resourcesJson)
    {
        IReadOnlyList<OrphanedResourceFinding> findings =
            OrphanedResourceClassifier.ClassifyFromResourcesJson(resourcesJson);

        findings.Should().BeEmpty();
    }

    [Fact]
    public void OrphanedResourceClassifier_flags_unattached_disks_and_ignores_managed_ones()
    {
        const string resourcesJson = """
            [
              { "resourceType": "Microsoft.Compute/disks", "resourceId": "/disks/no-properties" },
              { "resourceType": "Microsoft.Compute/disks", "resourceId": "/disks/no-managed-by", "properties": {} },
              { "resourceType": "Microsoft.Compute/disks", "resourceId": "/disks/attached", "properties": { "managedBy": "/vm/1" } }
            ]
            """;

        IReadOnlyList<OrphanedResourceFinding> findings =
            OrphanedResourceClassifier.ClassifyFromResourcesJson(resourcesJson);

        findings.Select(f => f.ResourceId)
            .Should()
            .BeEquivalentTo(["/disks/no-properties", "/disks/no-managed-by"]);

        findings.Should().OnlyContain(f => f.Category == "CostOptimization");
    }

    [Fact]
    public void OrphanedResourceClassifier_flags_network_interfaces_without_virtual_machine_attachment()
    {
        // The extractor emits virtualMachine either as an object with an id or as a bare resource-id string.
        const string resourcesJson = """
            [
              { "resourceType": "Microsoft.Network/networkInterfaces", "resourceId": "/nics/orphan", "properties": {} },
              { "resourceType": "Microsoft.Network/networkInterfaces", "resourceId": "/nics/object", "properties": { "virtualMachine": { "id": "/vm/1" } } },
              { "resourceType": "Microsoft.Network/networkInterfaces", "resourceId": "/nics/string", "properties": { "virtualMachine": "/vm/2" } }
            ]
            """;

        IReadOnlyList<OrphanedResourceFinding> findings =
            OrphanedResourceClassifier.ClassifyFromResourcesJson(resourcesJson);

        findings.Select(f => f.ResourceId).Should().BeEquivalentTo(["/nics/orphan"]);
        findings[0].Message.Should().Contain("virtualMachine");
    }

    [Fact]
    public void OrphanedResourceClassifier_flags_public_ips_without_usable_ip_configuration()
    {
        const string resourcesJson = """
            [
              { "resourceType": "Microsoft.Network/publicIPAddresses", "resourceId": "/ips/orphan", "properties": {} },
              { "resourceType": "Microsoft.Network/publicIPAddresses", "resourceId": "/ips/object", "properties": { "ipConfiguration": { "id": "/cfg/1" } } },
              { "resourceType": "Microsoft.Network/publicIPAddresses", "resourceId": "/ips/array", "properties": { "ipConfiguration": [ { "id": "/cfg/2" } ] } },
              { "resourceType": "Microsoft.Network/publicIPAddresses", "resourceId": "/ips/unexpected-kind", "properties": { "ipConfiguration": 42 } }
            ]
            """;

        IReadOnlyList<OrphanedResourceFinding> findings =
            OrphanedResourceClassifier.ClassifyFromResourcesJson(resourcesJson);

        findings.Select(f => f.ResourceId)
            .Should()
            .BeEquivalentTo(["/ips/orphan", "/ips/unexpected-kind"]);
    }

    [Fact]
    public void OrphanedResourceClassifier_flags_load_balancers_network_security_groups_and_route_tables()
    {
        const string resourcesJson = """
            [
              { "resourceType": "Microsoft.Network/loadBalancers", "resourceId": "/lbs/orphan", "properties": {} },
              { "resourceType": "Microsoft.Network/loadBalancers", "resourceId": "/lbs/live", "properties": { "backendAddressPools": [ { "id": "/pool/1" } ] } },
              { "resourceType": "Microsoft.Network/networkSecurityGroups", "resourceId": "/nsgs/orphan", "properties": {} },
              { "resourceType": "Microsoft.Network/networkSecurityGroups", "resourceId": "/nsgs/live", "properties": { "subnets": [ { "id": "/subnet/1" } ] } },
              { "resourceType": "Microsoft.Network/routeTables", "resourceId": "/routes/orphan", "properties": {} },
              { "resourceType": "Microsoft.Network/routeTables", "resourceId": "/routes/live", "properties": { "subnets": [ { "id": "/subnet/2" } ] } }
            ]
            """;

        IReadOnlyList<OrphanedResourceFinding> findings =
            OrphanedResourceClassifier.ClassifyFromResourcesJson(resourcesJson);

        findings.Select(f => f.ResourceId)
            .Should()
            .BeEquivalentTo(["/lbs/orphan", "/nsgs/orphan", "/routes/orphan"]);
    }

    [Fact]
    public void RegexTerraformValidator_accepts_blank_and_well_formed_snippets()
    {
        RegexTerraformValidator sut = new();

        sut.Validate("   ").IsValid.Should().BeTrue();

        const string hcl = """
            resource "azurerm_storage_account" "logs" {
              name = "archlucidlogs"
            }
            """;

        sut.Validate(hcl).IsValid.Should().BeTrue();
    }

    [Fact]
    public void RegexTerraformValidator_ignores_quotes_inside_comments_and_escaped_quotes()
    {
        RegexTerraformValidator sut = new();

        const string hcl = """
            # a comment with an "unbalanced quote
            resource "azurerm_storage_account" "logs" {
              name = "arch\"lucid"
            }
            """;

        sut.Validate(hcl).IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("}", "unexpected '}'")]
    [InlineData("resource \"azurerm_storage_account\" \"logs\" {", "Unbalanced Terraform braces.")]
    [InlineData("name = \"unclosed", "Unclosed string literal")]
    [InlineData("terraform required_version", "Malformed Terraform block header.")]
    [InlineData("locals my_values", "Malformed Terraform block header.")]
    [InlineData("variable \\\"orphan", "Malformed Terraform block header.")]
    [InlineData("resource \"azurerm_storage_account\" \"logs\"", "missing a body")]
    public void RegexTerraformValidator_rejects_malformed_hcl(string hcl, string expectedReasonFragment)
    {
        RegexTerraformValidator sut = new();

        TerraformValidationOutcome outcome = sut.Validate(hcl);

        outcome.IsValid.Should().BeFalse();
        outcome.FailureReason.Should().Contain(expectedReasonFragment);
    }

    [Fact]
    public void ArtifactMetadataRow_and_page_carry_keyset_paging_state()
    {
        Guid artifactId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid runId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid manifestId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        DateTime createdUtc = new(2026, 8, 8, 12, 0, 0, DateTimeKind.Utc);

        ArtifactMetadataRow row = new(
            SortOrder: 3,
            ArtifactId: artifactId,
            RunId: runId,
            ManifestId: manifestId,
            CreatedUtc: createdUtc,
            ArtifactType: "ArchitectureNarrative",
            Name: "narrative.md",
            Format: "markdown",
            ContentHash: "sha256:abc",
            ContentBlobUri: null);

        row.SortOrder.Should().Be(3);
        row.ArtifactId.Should().Be(artifactId);
        row.RunId.Should().Be(runId);
        row.ManifestId.Should().Be(manifestId);
        row.CreatedUtc.Should().Be(createdUtc);
        row.ArtifactType.Should().Be("ArchitectureNarrative");
        row.Name.Should().Be("narrative.md");
        row.Format.Should().Be("markdown");
        row.ContentHash.Should().Be("sha256:abc");
        row.ContentBlobUri.Should().BeNull();

        ArtifactMetadataRow blobBacked = row with { ContentBlobUri = "https://blob.example/narrative.md" };
        blobBacked.Should().NotBe(row);

        ArtifactBundleArtifactMetadataPage page = new([row, blobBacked], HasMore: true);

        page.Items.Should().HaveCount(2);
        page.HasMore.Should().BeTrue();
        page.ToString().Should().Contain("HasMore");
    }

    [Fact]
    public void Artifact_synthesis_model_DTOs_round_trip_properties()
    {
        ComplianceMatrixArtifactModel compliance = new()
        {
            Rows =
            [
                new ComplianceMatrixRow
                {
                    ControlId = "REQ-1",
                    ControlName = "Encrypt data at rest",
                    AppliesToCategory = "Storage",
                    Status = "Met",
                    Notes = "Policy pack mapping",
                },
            ],
        };

        compliance.Rows.Should().ContainSingle();
        compliance.Rows[0].ControlId.Should().Be("REQ-1");

        CostSummaryArtifactModel cost = new()
        {
            TopologyInferredInfrastructureUsdPerMonth = 120.5m,
            InfrastructureSummaryNote = "Retail blend",
            InfrastructureLines =
            [
                new CostSummaryInfrastructureLineModel
                {
                    LineKind = "compute",
                    DisplayName = "App Service",
                    EstimatedUsdPerMonth = 80m,
                    PriceSource = "heuristic",
                },
            ],
            MaxMonthlyCost = 200m,
            Risks = ["Burst traffic"],
            Notes = ["Illustrative only"],
        };

        cost.TopologyInferredInfrastructureUsdPerMonth.Should().Be(120.5m);
        cost.InfrastructureLines.Should().ContainSingle();
        cost.InfrastructureLines[0].DisplayName.Should().Be("App Service");

        CoverageSummaryArtifactModel coverage = new()
        {
            CoveredRequirementCount = 12,
            UncoveredRequirementCount = 3,
            SecurityGapCount = 1,
            ComplianceGapCount = 2,
            UnresolvedIssueCount = 4,
            TopologyGaps = ["Missing DR region"],
        };

        coverage.CoveredRequirementCount.Should().Be(12);
        coverage.TopologyGaps.Should().ContainSingle("Missing DR region");

        UnresolvedIssuesArtifactModel unresolved = new()
        {
            Items =
            [
                new UnresolvedIssueArtifactItem
                {
                    IssueType = "Constraint",
                    Title = "Undefined RPO",
                    Description = "Recovery point objective missing.",
                    Severity = "Medium",
                },
            ],
        };

        unresolved.Items.Should().ContainSingle();
        unresolved.Items[0].Title.Should().Be("Undefined RPO");
    }

    [Theory]
    [InlineData("BundleId")]
    [InlineData("ManifestId")]
    [InlineData("At least one artifact")]
    public void ArtifactBundleValidator_rejects_invalid_bundle_shape(string expectedFragment)
    {
        ArtifactBundle bundle = new()
        {
            BundleId = expectedFragment == "BundleId" ? Guid.Empty : Guid.NewGuid(),
            ManifestId = expectedFragment == "ManifestId" ? Guid.Empty : Guid.NewGuid(),
            Artifacts = expectedFragment == "At least one artifact"
                ? []
                :
                [
                    new SynthesizedArtifact
                    {
                        ArtifactType = "Inventory",
                        Content = "body",
                        ContentHash = "hash",
                    },
                ],
        };

        Action act = () => new ArtifactBundleValidator().Validate(bundle);

        act.Should().Throw<InvalidOperationException>().WithMessage($"*{expectedFragment}*");
    }

    [Fact]
    public void ArtifactBundleValidator_rejects_blank_artifact_type_or_hash()
    {
        ArtifactBundle bundle = new()
        {
            BundleId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Artifacts =
            [
                new SynthesizedArtifact
                {
                    ArtifactType = "   ",
                    Content = "body",
                    ContentHash = "hash",
                },
            ],
        };

        Action act = () => new ArtifactBundleValidator().Validate(bundle);

        act.Should().Throw<InvalidOperationException>().WithMessage("*ArtifactType*");
    }
}
