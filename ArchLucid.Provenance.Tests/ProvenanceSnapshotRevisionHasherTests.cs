using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Decisioning.Models;

using FluentAssertions;

namespace ArchLucid.Provenance.Tests;

[Trait("Category", "Unit")]
public sealed class ProvenanceSnapshotRevisionHasherTests
{
    private static readonly Guid RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid BundleId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    [Fact]
    public void Compute_changes_when_artifact_content_hash_changes()
    {
        ProvenanceBuildInput baseline = CreateInput(
        [
            new SynthesizedArtifact
            {
                ArtifactId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                ArtifactType = "doc",
                Name = "overview.md",
                Format = "md",
                Content = "v1",
                ContentHash = "hash-v1",
            },
        ]);

        ProvenanceBuildInput updated = CreateInput(
        [
            new SynthesizedArtifact
            {
                ArtifactId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                ArtifactType = "doc",
                Name = "overview.md",
                Format = "md",
                Content = "v2",
                ContentHash = "hash-v2",
            },
        ]);

        string baselineHash = ProvenanceSnapshotRevisionHasher.Compute(baseline, BundleId);
        string updatedHash = ProvenanceSnapshotRevisionHasher.Compute(updated, BundleId);

        updatedHash.Should().NotBe(baselineHash);
    }

    [Fact]
    public void Compute_changes_when_artifact_is_added()
    {
        ProvenanceBuildInput withoutSecond = CreateInput(
        [
            new SynthesizedArtifact
            {
                ArtifactId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                ArtifactType = "doc",
                Name = "overview.md",
                Format = "md",
                Content = "v1",
                ContentHash = "hash-v1",
            },
        ]);

        ProvenanceBuildInput withSecond = CreateInput(
        [
            new SynthesizedArtifact
            {
                ArtifactId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                ArtifactType = "doc",
                Name = "overview.md",
                Format = "md",
                Content = "v1",
                ContentHash = "hash-v1",
            },
            new SynthesizedArtifact
            {
                ArtifactId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                ArtifactType = "diagram",
                Name = "topology.mmd",
                Format = "mmd",
                Content = "graph",
                ContentHash = "hash-diagram",
            },
        ]);

        string withoutSecondHash = ProvenanceSnapshotRevisionHasher.Compute(withoutSecond, BundleId);
        string withSecondHash = ProvenanceSnapshotRevisionHasher.Compute(withSecond, BundleId);

        withSecondHash.Should().NotBe(withoutSecondHash);
    }

    private static ProvenanceBuildInput CreateInput(IReadOnlyList<SynthesizedArtifact> artifacts)
    {
        Guid findingsSnapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        Guid graphSnapshotId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        Guid manifestId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid decisionTraceId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        return new ProvenanceBuildInput
        {
            RunId = RunId,
            Findings = new FindingsSnapshot
            {
                FindingsSnapshotId = findingsSnapshotId,
                RunId = RunId,
                GraphSnapshotId = graphSnapshotId,
                Findings = [],
            },
            Graph = new GraphSnapshot
            {
                GraphSnapshotId = graphSnapshotId,
                RunId = RunId,
                Nodes = [],
            },
            Manifest = new ManifestDocument
            {
                ManifestId = manifestId,
                RunId = RunId,
                ManifestHash = "mh",
                Decisions = [],
            },
            DecisionTrace = RuleAuditTraceDto.From(
                new RuleAuditTracePayload
                {
                    DecisionTraceId = decisionTraceId,
                    RunId = RunId,
                }),
            Artifacts = artifacts,
        };
    }
}
