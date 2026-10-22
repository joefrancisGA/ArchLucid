using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Decisioning.Validation;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Validation;

[Trait("Category", "Unit")]
public sealed class AgentResultMergeNormalizerTests
{
    [Fact]
    public void Normalize_dropsServiceWhenBothNameAndIdAreEmpty()
    {
        // Explicitly set ServiceId = "" to override the auto-generated GUID default.
        AgentResult result = BuildTopologyResultWith(addedServices:
        [
            new ManifestService { ServiceId = "", ServiceName = "", ServiceType = ServiceType.Api, RuntimePlatform = RuntimePlatform.AppService },
            new ManifestService { ServiceId = "svc-a", ServiceName = "ValidService", ServiceType = ServiceType.Api, RuntimePlatform = RuntimePlatform.AppService }
        ]);

        AgentResult normalized = AgentResultMergeNormalizer.Normalize(result);

        normalized.ProposedChanges!.AddedServices.Should().HaveCount(1);
        normalized.ProposedChanges.AddedServices[0].ServiceName.Should().Be("ValidService");
    }

    [Fact]
    public void Normalize_dropsDatastoreWhenBothNameAndIdAreEmpty()
    {
        AgentResult result = BuildTopologyResultWith(addedDatastores:
        [
            new ManifestDatastore { DatastoreId = "", DatastoreName = "", DatastoreType = DatastoreType.Sql, RuntimePlatform = RuntimePlatform.SqlServer },
            new ManifestDatastore { DatastoreId = "ds-a", DatastoreName = "ValidDatastore", DatastoreType = DatastoreType.Sql, RuntimePlatform = RuntimePlatform.SqlServer }
        ]);

        AgentResult normalized = AgentResultMergeNormalizer.Normalize(result);

        normalized.ProposedChanges!.AddedDatastores.Should().HaveCount(1);
        normalized.ProposedChanges.AddedDatastores[0].DatastoreName.Should().Be("ValidDatastore");
    }

    [Fact]
    public void Normalize_coercesUndefinedRelationshipTypeToDefaultCalls()
    {
        // Simulates live LLM returning integer 0, which is not a defined RelationshipType value.
        var undefinedType = (RelationshipType)0;

        AgentResult result = BuildTopologyResultWith(addedRelationships:
        [
            new ManifestRelationship { SourceId = "svc-a", TargetId = "ds-b", RelationshipType = undefinedType },
            new ManifestRelationship { SourceId = "svc-a", TargetId = "svc-b", RelationshipType = RelationshipType.ReadsFrom }
        ]);

        AgentResult normalized = AgentResultMergeNormalizer.Normalize(result);

        normalized.ProposedChanges!.AddedRelationships.Should().HaveCount(2);
        normalized.ProposedChanges.AddedRelationships[0].RelationshipType.Should().Be(RelationshipType.Calls);
        normalized.ProposedChanges.AddedRelationships[1].RelationshipType.Should().Be(RelationshipType.ReadsFrom);
    }

    [Fact]
    public void Normalize_dropsRelationshipsWithEmptySourceOrTargetId()
    {
        AgentResult result = BuildTopologyResultWith(addedRelationships:
        [
            new ManifestRelationship { SourceId = "", TargetId = "ds-b", RelationshipType = RelationshipType.WritesTo },
            new ManifestRelationship { SourceId = "svc-a", TargetId = "", RelationshipType = RelationshipType.WritesTo },
            new ManifestRelationship { SourceId = "svc-a", TargetId = "ds-b", RelationshipType = RelationshipType.WritesTo }
        ]);

        AgentResult normalized = AgentResultMergeNormalizer.Normalize(result);

        normalized.ProposedChanges!.AddedRelationships.Should().HaveCount(1);
        normalized.ProposedChanges.AddedRelationships[0].SourceId.Should().Be("svc-a");
    }

    [Fact]
    public void Normalize_assignsServiceIdFromServiceNameWhenMissing()
    {
        // Explicitly clear ServiceId ("" overrides the auto-GUID default initializer).
        AgentResult result = BuildTopologyResultWith(addedServices:
        [
            new ManifestService { ServiceId = "", ServiceName = "my-api", ServiceType = ServiceType.Api, RuntimePlatform = RuntimePlatform.AppService }
        ]);

        AgentResult normalized = AgentResultMergeNormalizer.Normalize(result);

        normalized.ProposedChanges!.AddedServices[0].ServiceId.Should().Be("my-api");
    }

    [Fact]
    public void Normalize_assignsServiceNameFromServiceIdWhenNameEmpty()
    {
        // Simulates live LLM returning serviceName="" but a valid serviceId — normalizer repairs rather than drops.
        AgentResult result = BuildTopologyResultWith(addedServices:
        [
            new ManifestService { ServiceId = "my-api-id", ServiceName = "", ServiceType = ServiceType.Api, RuntimePlatform = RuntimePlatform.AppService }
        ]);

        AgentResult normalized = AgentResultMergeNormalizer.Normalize(result);

        normalized.ProposedChanges!.AddedServices.Should().HaveCount(1);
        normalized.ProposedChanges.AddedServices[0].ServiceName.Should().Be("my-api-id");
    }

    [Fact]
    public void Normalize_assignsDatastoreIdFromDatastoreNameWhenMissing()
    {
        // ManifestDatastore.DatastoreId also auto-generates a GUID; override it explicitly.
        AgentResult result = BuildTopologyResultWith(addedDatastores:
        [
            new ManifestDatastore { DatastoreId = "", DatastoreName = "my-db", DatastoreType = DatastoreType.Sql, RuntimePlatform = RuntimePlatform.SqlServer }
        ]);

        AgentResult normalized = AgentResultMergeNormalizer.Normalize(result);

        normalized.ProposedChanges!.AddedDatastores[0].DatastoreId.Should().Be("my-db");
    }

    [Fact]
    public void Normalize_assignsDatastoreNameFromDatastoreIdWhenNameEmpty()
    {
        // Simulates live LLM returning datastoreName="" but a valid datastoreId.
        AgentResult result = BuildTopologyResultWith(addedDatastores:
        [
            new ManifestDatastore { DatastoreId = "my-db-id", DatastoreName = "", DatastoreType = DatastoreType.Sql, RuntimePlatform = RuntimePlatform.SqlServer }
        ]);

        AgentResult normalized = AgentResultMergeNormalizer.Normalize(result);

        normalized.ProposedChanges!.AddedDatastores.Should().HaveCount(1);
        normalized.ProposedChanges.AddedDatastores[0].DatastoreName.Should().Be("my-db-id");
    }

    [Fact]
    public void Normalize_returnsNullProposedChangesUnchanged()
    {
        AgentResult result = new()
        {
            ResultId = "RES-NULL-PC",
            TaskId = "TASK-1",
            RunId = "RUN-1",
            AgentType = AgentType.Compliance,
            Claims = ["claim"],
            EvidenceRefs = [],
            Confidence = 0.9,
            ProposedChanges = null
        };

        AgentResult normalized = AgentResultMergeNormalizer.Normalize(result);

        normalized.ProposedChanges.Should().BeNull();
    }

    private static AgentResult BuildTopologyResultWith(
        List<ManifestService>? addedServices = null,
        List<ManifestDatastore>? addedDatastores = null,
        List<ManifestRelationship>? addedRelationships = null)
    {
        return new AgentResult
        {
            ResultId = "RES-NORM-TEST",
            TaskId = "TASK-NORM",
            RunId = "RUN-NORM",
            AgentType = AgentType.Topology,
            Claims = ["test claim"],
            EvidenceRefs = [],
            Confidence = 0.85,
            ProposedChanges = new AgentTopologyProposal
            {
                ProposalId = "PROP-NORM",
                SourceAgent = AgentType.Topology,
                AddedServices = addedServices ?? [],
                AddedDatastores = addedDatastores ?? [],
                AddedRelationships = addedRelationships ?? []
            }
        };
    }
}
