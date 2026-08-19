using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Persistence.GoldenManifests;
using ArchLucid.Persistence.Serialization;

using CoreManifestMetadata = ArchLucid.Core.Manifest.Sections.ManifestMetadata;

namespace ArchLucid.Persistence.Tests.GoldenManifests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class GoldenManifestPriorRetrievalReadTests
{
    [Fact]
    public void Hydrate_deserializes_decisions_topology_and_metadata_without_other_sections()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Guid manifestId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid runId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        DateTime createdUtc = new(2026, 8, 10, 12, 0, 0, DateTimeKind.Utc);

        List<ResolvedArchitectureDecision> decisions =
        [
            new()
            {
                DecisionId = "d1",
                Category = "Security",
                Title = "Use private endpoints",
                SelectedOption = "PrivateEndpoint",
                Rationale = "Least privilege network path",
            },
        ];

        TopologySection topology = new()
        {
            Services =
            [
                new ManifestService
                {
                    ServiceName = "api",
                    ServiceType = ServiceType.Api,
                    RuntimePlatform = RuntimePlatform.AppService,
                },
            ],
            Datastores =
            [
                new ManifestDatastore
                {
                    DatastoreName = "sql",
                    DatastoreType = DatastoreType.Sql,
                    RuntimePlatform = RuntimePlatform.SqlServer,
                },
            ],
        };

        CoreManifestMetadata metadata = new()
        {
            Name = "Prior retrieval fixture",
            Version = "ver-prior-1",
            Status = "Committed",
            Summary = "Slim hydrate fixture",
        };

        GoldenManifestStorageRow row = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            ManifestId = manifestId,
            RunId = runId,
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            FindingsSnapshotId = Guid.NewGuid(),
            DecisionTraceId = Guid.NewGuid(),
            CreatedUtc = createdUtc,
            ManifestHash = "hash",
            RuleSetId = "rules",
            RuleSetVersion = "1",
            RuleSetHash = "rh",
            MetadataJson = JsonEntitySerializer.Serialize(metadata),
            TopologyJson = JsonEntitySerializer.Serialize(topology),
            DecisionsJson = JsonEntitySerializer.Serialize(decisions),
            ContractManifestVersion = "ver-prior-1",
        };

        ManifestDocument document = GoldenManifestPriorRetrievalRead.Hydrate(row);

        document.TenantId.Should().Be(tenantId);
        document.WorkspaceId.Should().Be(workspaceId);
        document.ProjectId.Should().Be(projectId);
        document.ManifestId.Should().Be(manifestId);
        document.RunId.Should().Be(runId);
        document.CreatedUtc.Should().Be(createdUtc);
        document.Metadata.Version.Should().Be("ver-prior-1");
        document.Metadata.Name.Should().Be("Prior retrieval fixture");
        document.Decisions.Should().HaveCount(1);
        document.Decisions[0].Title.Should().Be("Use private endpoints");
        document.Topology.Services.Should().ContainSingle(s => s.ServiceName == "api");
        document.Topology.Datastores.Should().ContainSingle(d => d.DatastoreName == "sql");
        document.Requirements.Should().NotBeNull();
        document.Security.Should().NotBeNull();
        document.Assumptions.Should().BeEmpty();
        document.Warnings.Should().BeEmpty();
    }

    [Fact]
    public void Hydrate_tolerates_whitespace_and_corrupt_json_slices()
    {
        GoldenManifestStorageRow row = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            ManifestHash = "h",
            RuleSetId = "r",
            RuleSetVersion = "1",
            RuleSetHash = "rh",
            MetadataJson = "   ",
            TopologyJson = "{not-json",
            DecisionsJson = string.Empty,
        };

        ManifestDocument document = GoldenManifestPriorRetrievalRead.Hydrate(row);

        document.Metadata.Should().NotBeNull();
        document.Topology.Should().NotBeNull();
        document.Decisions.Should().BeEmpty();
    }
}
