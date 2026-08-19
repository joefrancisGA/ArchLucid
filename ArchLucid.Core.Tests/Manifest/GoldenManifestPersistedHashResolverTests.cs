using ArchLucid.Core.Manifest;

using FluentAssertions;

using Moq;

namespace ArchLucid.Core.Tests.Manifest;

[Trait("Category", "Unit")]
public sealed class GoldenManifestPersistedHashResolverTests
{
    [Fact]
    public void Resolve_uses_precomputed_hash_when_present()
    {
        ManifestDocument model = new() { ManifestId = Guid.NewGuid() };
        SaveContractsManifestOptions keying = new()
        {
            ManifestId = model.ManifestId,
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            FindingsSnapshotId = Guid.NewGuid(),
            DecisionTraceId = Guid.NewGuid(),
            RuleSetId = "rules",
            RuleSetVersion = "1",
            RuleSetHash = "hash",
            PrecomputedManifestHash = "PRECOMPUTED"
        };
        Mock<IManifestHashService> hashService = new();

        string resolved = GoldenManifestPersistedHashResolver.Resolve(keying, model, hashService.Object);

        resolved.Should().Be("PRECOMPUTED");
        hashService.Verify(h => h.ComputeHash(It.IsAny<ManifestDocument>()), Times.Never);
    }

    [Fact]
    public void Resolve_computes_hash_when_precomputed_missing()
    {
        ManifestDocument model = new() { ManifestId = Guid.NewGuid() };
        SaveContractsManifestOptions keying = new()
        {
            ManifestId = model.ManifestId,
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            FindingsSnapshotId = Guid.NewGuid(),
            DecisionTraceId = Guid.NewGuid(),
            RuleSetId = "rules",
            RuleSetVersion = "1",
            RuleSetHash = "hash",
        };
        Mock<IManifestHashService> hashService = new();
        hashService.Setup(h => h.ComputeHash(model)).Returns("COMPUTED");

        string resolved = GoldenManifestPersistedHashResolver.Resolve(keying, model, hashService.Object);

        resolved.Should().Be("COMPUTED");
    }
}
