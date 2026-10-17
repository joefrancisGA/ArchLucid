using ArchLucid.Core.Manifest;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Manifest;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SaveContractsManifestOptionsTests
{
    [Fact]
    public void WithPrecomputedManifestHash_copies_keying_and_replaces_hash()
    {
        Guid manifestId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid runId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid contextSnapshotId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        Guid graphSnapshotId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        Guid findingsSnapshotId = Guid.Parse("55555555-5555-5555-5555-555555555555");
        Guid decisionTraceId = Guid.Parse("66666666-6666-6666-6666-666666666666");
        DateTime createdUtc = new(2026, 10, 17, 6, 0, 0, DateTimeKind.Utc);
        SaveContractsManifestOptions original = new()
        {
            ManifestId = manifestId,
            RunId = runId,
            ContextSnapshotId = contextSnapshotId,
            GraphSnapshotId = graphSnapshotId,
            FindingsSnapshotId = findingsSnapshotId,
            DecisionTraceId = decisionTraceId,
            RuleSetId = "rules",
            RuleSetVersion = "1",
            RuleSetHash = "hash",
            CreatedUtc = createdUtc,
            PrecomputedManifestHash = "PIPELINE",
        };

        SaveContractsManifestOptions copy = original.WithPrecomputedManifestHash("SEALED");

        copy.Should().NotBeSameAs(original);
        copy.ManifestId.Should().Be(manifestId);
        copy.RunId.Should().Be(runId);
        copy.ContextSnapshotId.Should().Be(contextSnapshotId);
        copy.GraphSnapshotId.Should().Be(graphSnapshotId);
        copy.FindingsSnapshotId.Should().Be(findingsSnapshotId);
        copy.DecisionTraceId.Should().Be(decisionTraceId);
        copy.RuleSetId.Should().Be("rules");
        copy.RuleSetVersion.Should().Be("1");
        copy.RuleSetHash.Should().Be("hash");
        copy.CreatedUtc.Should().Be(createdUtc);
        copy.PrecomputedManifestHash.Should().Be("SEALED");
        original.PrecomputedManifestHash.Should().Be("PIPELINE");
    }

    [Fact]
    public void WithPrecomputedManifestHash_allows_clearing_the_hash()
    {
        SaveContractsManifestOptions original = new()
        {
            ManifestId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            FindingsSnapshotId = Guid.NewGuid(),
            DecisionTraceId = Guid.NewGuid(),
            RuleSetId = "rules",
            RuleSetVersion = "1",
            RuleSetHash = "hash",
            PrecomputedManifestHash = "PIPELINE",
        };

        SaveContractsManifestOptions copy = original.WithPrecomputedManifestHash(null);

        copy.PrecomputedManifestHash.Should().BeNull();
    }
}
