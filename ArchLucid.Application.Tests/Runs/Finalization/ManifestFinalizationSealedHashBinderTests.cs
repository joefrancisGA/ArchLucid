using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Services;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Finalization;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ManifestFinalizationSealedHashBinderTests
{
    [Fact]
    public void Bind_throws_when_keying_is_null()
    {
        Action act = () => ManifestFinalizationSealedHashBinder.Bind(
            null!,
            new ManifestDocument(),
            new ManifestHashService());

        act.Should().Throw<ArgumentNullException>().WithParameterName("keying");
    }

    [Fact]
    public void Bind_throws_when_model_is_null()
    {
        Action act = () => ManifestFinalizationSealedHashBinder.Bind(
            CreateKeying("PIPELINE"),
            null!,
            new ManifestHashService());

        act.Should().Throw<ArgumentNullException>().WithParameterName("model");
    }

    [Fact]
    public void Bind_throws_when_hash_service_is_null()
    {
        Action act = () => ManifestFinalizationSealedHashBinder.Bind(
            CreateKeying("PIPELINE"),
            new ManifestDocument(),
            null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("manifestHashService");
    }

    [Fact]
    public void Bind_replaces_stale_pipeline_hash_after_architecture_version_is_set()
    {
        ManifestHashService hasher = new();
        ManifestDocument model = new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            ManifestId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            RunId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
            RuleSetId = "rs",
            RuleSetVersion = "1",
            RuleSetHash = "rh",
        };
        string pipelineHash = hasher.ComputeHash(model);
        model.ArchitectureVersionId = Guid.Parse("66666666-6666-6666-6666-666666666666");
        model.CreateTimeArchitectureVersionContentHashSha256 =
            "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
        model.ManifestHash = pipelineHash;
        SaveContractsManifestOptions keying = CreateKeying(pipelineHash);

        SaveContractsManifestOptions sealedKeying = ManifestFinalizationSealedHashBinder.Bind(
            keying,
            model,
            hasher);

        string expected = hasher.ComputeHash(model);
        expected.Should().NotBe(pipelineHash);
        sealedKeying.PrecomputedManifestHash.Should().Be(expected);
        model.ManifestHash.Should().Be(expected);
        keying.PrecomputedManifestHash.Should().Be(pipelineHash);
    }

    [Fact]
    public void Bind_uses_hash_service_result()
    {
        ManifestDocument model = new() { ManifestId = Guid.NewGuid() };
        Mock<IManifestHashService> hasher = new();
        hasher.Setup(h => h.ComputeHash(model)).Returns("SEALED");

        SaveContractsManifestOptions sealedKeying = ManifestFinalizationSealedHashBinder.Bind(
            CreateKeying("PIPELINE"),
            model,
            hasher.Object);

        sealedKeying.PrecomputedManifestHash.Should().Be("SEALED");
        model.ManifestHash.Should().Be("SEALED");
    }

    private static SaveContractsManifestOptions CreateKeying(string? precomputedManifestHash)
    {
        return new SaveContractsManifestOptions
        {
            ManifestId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            FindingsSnapshotId = Guid.NewGuid(),
            DecisionTraceId = Guid.NewGuid(),
            RuleSetId = "rs",
            RuleSetVersion = "1",
            RuleSetHash = "rh",
            PrecomputedManifestHash = precomputedManifestHash,
        };
    }
}
