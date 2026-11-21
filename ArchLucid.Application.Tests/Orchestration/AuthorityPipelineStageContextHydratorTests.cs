using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Contracts.Persistence.Artifacts;
using ArchLucid.Contracts.Persistence.Ports;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using Moq;

namespace ArchLucid.Application.Tests.Orchestration;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthorityPipelineStageContextHydratorTests
{
    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task Artifact_checkpoint_hydrates_only_the_bundle_recorded_by_the_run(bool recordedBundleExists)
    {
        AuthorityPipelineContext context = AuthorityPipelineStagesExecutorTestFactory.CreateContext();
        Guid manifestId = Guid.NewGuid();
        Guid recordedBundleId = Guid.NewGuid();
        context.Run.GoldenManifestId = manifestId;
        context.Run.ArtifactBundleId = recordedBundleId;
        ArtifactBundle recorded = new() { BundleId = recordedBundleId, ManifestId = manifestId };
        ArtifactBundle newer = new() { BundleId = Guid.NewGuid(), ManifestId = manifestId };
        Mock<IArtifactBundleRepository> repository = new();
        repository.Setup(r => r.GetByManifestIdAsync(It.IsAny<ScopeContext>(), manifestId, false, CancellationToken.None))
            .ReturnsAsync(newer);
        repository.Setup(r => r.GetByBundleIdInScopeAsync(context.Scope, recordedBundleId, false, CancellationToken.None))
            .ReturnsAsync(recordedBundleExists ? recorded : null);
        AuthorityPipelineStageContextHydrator hydrator = new(
            Mock.Of<IContextSnapshotRepository>(),
            Mock.Of<IGraphSnapshotRepository>(),
            Mock.Of<IFindingsSnapshotRepository>(),
            Mock.Of<IDecisionTraceRepository>(),
            Mock.Of<IGoldenManifestRepository>(),
            repository.Object);

        bool hydrated = await hydrator.TryHydrateAsync(context, "artifacts", CancellationToken.None);

        Assert.Equal(recordedBundleExists, hydrated);
        Assert.Same(recordedBundleExists ? recorded : null, context.ArtifactBundle);
    }
}
