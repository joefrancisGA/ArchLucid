using ArchLucid.Application.Evidence;
using ArchLucid.Application.Summaries;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.AgentEvaluation;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ApplicationPackageCoverageBatch6Tests
{
    [Fact]
    public void MarkdownManifestSummaryGenerator_rejects_null_formatter()
    {
        Action act = () => _ = new MarkdownManifestSummaryGenerator(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void MarkdownManifestSummaryGenerator_emits_full_manifest_sections_and_evidence()
    {
        Mock<IEvidenceSummaryFormatter> evidence = new();
        evidence.Setup(f => f.FormatMarkdown(It.IsAny<AgentEvidencePackage>()))
            .Returns("## Evidence Block\n");
        MarkdownManifestSummaryGenerator sut = new(evidence.Object);
        GoldenManifest manifest = new()
        {
            RunId = Guid.NewGuid().ToString("N"),
            SystemName = "Payments Platform",
            Services =
            [
                new ManifestService
                {
                    ServiceId = "svc-api",
                    ServiceName = "CheckoutApi",
                    ServiceType = ServiceType.Api,
                    RuntimePlatform = RuntimePlatform.Aks,
                    Purpose = "Accept payments",
                    RequiredControls = ["mfa"],
                    Tags = ["pci"],
                },
            ],
            Datastores =
            [
                new ManifestDatastore
                {
                    DatastoreId = "db-1",
                    DatastoreName = "Ledger",
                    DatastoreType = DatastoreType.Sql,
                    RuntimePlatform = RuntimePlatform.SqlServer,
                    Purpose = "Transactions",
                    PrivateEndpointRequired = true,
                    EncryptionAtRestRequired = true,
                },
            ],
            Relationships =
            [
                new ManifestRelationship
                {
                    SourceId = "svc-api",
                    TargetId = "db-1",
                    RelationshipType = RelationshipType.WritesTo,
                    Description = "persists charges",
                },
                new ManifestRelationship
                {
                    SourceId = "svc-api",
                    TargetId = "db-1",
                    RelationshipType = RelationshipType.ReadsFrom,
                },
                new ManifestRelationship
                {
                    SourceId = "svc-api",
                    TargetId = "idp",
                    RelationshipType = RelationshipType.AuthenticatesWith,
                },
                new ManifestRelationship
                {
                    SourceId = "svc-api",
                    TargetId = "bus",
                    RelationshipType = RelationshipType.PublishesTo,
                },
                new ManifestRelationship
                {
                    SourceId = "worker",
                    TargetId = "bus",
                    RelationshipType = RelationshipType.SubscribesTo,
                },
                new ManifestRelationship
                {
                    SourceId = "svc-api",
                    TargetId = "peer",
                    RelationshipType = RelationshipType.Calls,
                },
            ],
            Governance = new ManifestGovernance
            {
                RequiredControls = ["encryption"],
                ComplianceTags = ["sox"],
                PolicyConstraints = ["no-public-sql"],
                RiskClassification = "High",
                CostClassification = "Medium",
            },
            Metadata = new ManifestMetadata
            {
                ManifestVersion = "v2",
                ParentManifestVersion = "v1",
                ChangeDescription = "Added ledger",
                CreatedUtc = new DateTime(2026, 1, 2, 3, 4, 5, DateTimeKind.Utc),
                DecisionTraceIds = ["trace-1", "trace-2"],
            },
        };

        string markdown = sut.GenerateMarkdown(
            manifest,
            new AgentEvidencePackage { EvidencePackageId = "ev-1", RunId = manifest.RunId });

        markdown.Should().Contain("# Architecture Summary: Payments Platform");
        markdown.Should().Contain("## Services");
        markdown.Should().Contain("CheckoutApi");
        markdown.Should().Contain("Purpose: Accept payments");
        markdown.Should().Contain("## Datastores");
        markdown.Should().Contain("Private Endpoint Required: Yes");
        markdown.Should().Contain("writes to");
        markdown.Should().Contain("reads from");
        markdown.Should().Contain("authenticates with");
        markdown.Should().Contain("publishes to");
        markdown.Should().Contain("subscribes to");
        markdown.Should().Contain("calls");
        markdown.Should().Contain("Required Controls: encryption");
        markdown.Should().Contain("Parent Manifest Version: v1");
        markdown.Should().Contain("Decision Trace Count: 2");
        markdown.Should().Contain("Evidence Block");
        evidence.Verify(f => f.FormatMarkdown(It.IsAny<AgentEvidencePackage>()), Times.Once);
    }

    [Fact]
    public void MarkdownManifestSummaryGenerator_empty_collections_use_none_recorded_governance()
    {
        MarkdownManifestSummaryGenerator sut = new(Mock.Of<IEvidenceSummaryFormatter>());
        GoldenManifest manifest = new()
        {
            SystemName = "EmptySys",
            Governance = new ManifestGovernance(),
            Metadata = new ManifestMetadata { ManifestVersion = "1" },
        };

        string markdown = sut.GenerateMarkdown(manifest);

        markdown.Should().Contain("0 service(s)");
        markdown.Should().Contain("Required Controls: None recorded");
        markdown.Should().Contain("Compliance Tags: None recorded");
        markdown.Should().NotContain("## Services");
        markdown.Should().NotContain("---");
    }

    [Fact]
    public void MarkdownManifestSummaryGenerator_rejects_null_manifest()
    {
        MarkdownManifestSummaryGenerator sut = new(Mock.Of<IEvidenceSummaryFormatter>());

        Action act = () => sut.GenerateMarkdown(null!);

        act.Should().Throw<ArgumentNullException>();
    }
}
