using ArchLucid.Core.Evidence;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;
using ArchLucid.Decisioning.Interfaces;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Evidence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DefaultEvidenceBuilderTests
{
    private static ArchitectureRequest MinimalRequest(params Action<ArchitectureRequest>?[] adjust)
    {
        ArchitectureRequest req = new()
        {
            Description = new string('b', 20),
            SystemName = "AcctSvc",
            Environment = "prod",
        };

        foreach (Action<ArchitectureRequest>? a in adjust)
        {
            a?.Invoke(req);
        }

        return req;
    }

    [Fact]
    public async Task Greenfield_without_prior_version_does_not_query_reader_or_emit_prior_note()
    {
        Mock<IUnifiedGoldenManifestReader> reader = new(MockBehavior.Strict);
        DefaultEvidenceBuilder sut = new(reader.Object);

        ArchitectureRequest request = MinimalRequest();

        AgentEvidencePackage package = await sut.BuildAsync(Guid.NewGuid().ToString("N"), request);

        package.PriorManifest.Should().BeNull();
        package.Notes.Should().NotContain(n => n.NoteType == EvidenceNoteTypes.PriorManifestUnavailable);
    }

    [Fact]
    public async Task Prior_version_found_hydrates_PriorManifest_and_omits_unavailable_note()
    {
        const string priorVersionKey = "v-prior-integration";
        GoldenManifest prior = SamplePriorManifest(priorVersionKey);

        Mock<IUnifiedGoldenManifestReader> reader = new();
        reader
            .Setup(r => r.GetByVersionAsync(priorVersionKey, It.IsAny<CancellationToken>()))
            .ReturnsAsync(prior);

        DefaultEvidenceBuilder sut = new(reader.Object);
        ArchitectureRequest request = MinimalRequest(r => r.PriorManifestVersion = priorVersionKey);

        AgentEvidencePackage package = await sut.BuildAsync(Guid.NewGuid().ToString("N"), request);

        reader.Verify(r => r.GetByVersionAsync(priorVersionKey, It.IsAny<CancellationToken>()), Times.Once);
        package.PriorManifest.Should().NotBeNull();
        package.PriorManifest!.ManifestVersion.Should().Be(priorVersionKey);
        package.PriorManifest.Summary.Should().Contain("AcctDb");

        package.PriorManifest.ExistingServices.Should().Equal("B", "C Service");
        package.PriorManifest.ExistingDatastores.Should().Equal("AcctDb");

        package.PriorManifest.ExistingRequiredControls.Should().Equal("Encryption", "IAM");

        package.Notes.Should().NotContain(n => n.NoteType == EvidenceNoteTypes.PriorManifestUnavailable);
    }

    [Fact]
    public async Task Prior_version_missing_produces_greenfield_note_and_null_PriorManifest()
    {
        const string gone = "v-does-not-exist";
        Mock<IUnifiedGoldenManifestReader> reader = new();
        reader.Setup(r => r.GetByVersionAsync(gone, It.IsAny<CancellationToken>())).ReturnsAsync((GoldenManifest?)null);

        DefaultEvidenceBuilder sut = new(reader.Object);
        ArchitectureRequest request = MinimalRequest(r => r.PriorManifestVersion = gone);

        AgentEvidencePackage package = await sut.BuildAsync(Guid.NewGuid().ToString("N"), request);

        package.PriorManifest.Should().BeNull();
        EvidenceNote? note = package.Notes.SingleOrDefault(n => n.NoteType == EvidenceNoteTypes.PriorManifestUnavailable);
        note.Should().NotBeNull();
        note.Message.Should().Contain("greenfield");
    }

    private static GoldenManifest SamplePriorManifest(string version)
    {
        return new GoldenManifest
        {
            RunId = Guid.NewGuid().ToString("N"),
            SystemName = "AcctDb",
            Metadata = new ManifestMetadata
            {
                ManifestVersion = version,
                ChangeDescription = "Rollout",
                CreatedUtc = new DateTime(2026, 4, 2, 12, 0, 0, DateTimeKind.Utc),
            },
            Governance = new ManifestGovernance { RequiredControls = ["Encryption"], },
            Services =
            [
                new ManifestService
                {
                    ServiceName = "C Service", ServiceType = ServiceType.Api, RuntimePlatform = RuntimePlatform.AppService, RequiredControls = ["IAM"],
                },

                new ManifestService { ServiceName = "B", ServiceType = ServiceType.Worker, RuntimePlatform = RuntimePlatform.Functions, },
            ],
            Datastores =
            [
                new ManifestDatastore { DatastoreName = "AcctDb", DatastoreType = DatastoreType.Sql, RuntimePlatform = RuntimePlatform.SqlServer, },
            ],
            Relationships = [],
        };
    }
}
