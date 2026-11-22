using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Repositories;
using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryArtifactBundleSnapshotIsolationTests
{
    [Fact]
    public async Task SaveAsync_detaches_caller_owned_artifact_trace_and_scope()
    {
        InMemoryArtifactBundleRepository repository = new();
        ScopeContext scope = NewScope();
        ArtifactBundle input = NewBundle(scope);
        Guid manifestId = input.ManifestId;
        Guid bundleId = input.BundleId;
        await repository.SaveAsync(input, CancellationToken.None);

        input.TenantId = Guid.NewGuid();
        input.Artifacts[0].Content = "tampered";
        input.Artifacts[0].Metadata["source"] = "tampered";
        input.Artifacts[0].ContributingDecisionIds.Add("unexpected");
        input.Trace.Notes.Add("tampered");

        ArtifactBundle? saved = await repository.GetByBundleIdInScopeAsync(
            scope, bundleId, loadArtifactBodies: true, CancellationToken.None);
        saved.Should().NotBeNull();
        saved!.ManifestId.Should().Be(manifestId);
        saved.TenantId.Should().Be(scope.TenantId);
        saved.Artifacts[0].Content.Should().Be("original");
        saved.Artifacts[0].Metadata["source"].Should().Be("verified");
        saved.Artifacts[0].ContributingDecisionIds.Should().Equal("d1");
        saved.Trace.Notes.Should().Equal("initial");
    }

    [Fact]
    public async Task Full_body_reads_and_single_artifact_reads_do_not_mutate_stored_rows()
    {
        InMemoryArtifactBundleRepository repository = new();
        ScopeContext scope = NewScope();
        ArtifactBundle original = NewBundle(scope);
        Guid artifactId = original.Artifacts[0].ArtifactId;
        await repository.SaveAsync(original, CancellationToken.None);

        ArtifactBundle first = (await repository.GetByManifestIdAsync(
            scope, original.ManifestId, loadArtifactBodies: true, CancellationToken.None))!;
        first.Artifacts[0].Content = "changed";
        first.Artifacts[0].Metadata.Clear();
        first.Artifacts[0].ContributingDecisionIds.Clear();
        first.Artifacts[0].Status = SynthesizedArtifactGenerationStatus.Failed;
        first.Trace.GeneratorsUsed.Clear();
        first.Status = ArtifactBundleStatus.Failed;

        SynthesizedArtifact direct = (await repository.GetArtifactByIdAsync(
            scope, original.ManifestId, artifactId, CancellationToken.None))!;
        direct.Content.Should().Be("original");
        direct.Metadata["source"].Should().Be("verified");
        direct.Content = "changed again";

        ArtifactBundle later = (await repository.GetByBundleIdInScopeAsync(
            scope, original.BundleId, loadArtifactBodies: true, CancellationToken.None))!;
        later.Status.Should().Be(ArtifactBundleStatus.Partial);
        later.Artifacts[0].Status.Should().Be(SynthesizedArtifactGenerationStatus.Pending);
        later.Artifacts[0].Content.Should().Be("original");
        later.Artifacts[0].Metadata["source"].Should().Be("verified");
        later.Artifacts[0].ContributingDecisionIds.Should().Equal("d1");
        later.Trace.GeneratorsUsed.Should().Equal("generator");
    }

    [Fact]
    public async Task Descriptor_reads_preserve_lifecycle_status_without_exposing_mutable_trace()
    {
        InMemoryArtifactBundleRepository repository = new();
        ScopeContext scope = NewScope();
        ArtifactBundle original = NewBundle(scope);
        await repository.SaveAsync(original, CancellationToken.None);

        ArtifactBundle descriptor = (await repository.GetByManifestIdAsync(
            scope, original.ManifestId, loadArtifactBodies: false, CancellationToken.None))!;
        descriptor.Status.Should().Be(ArtifactBundleStatus.Partial);
        descriptor.Artifacts[0].Status.Should().Be(SynthesizedArtifactGenerationStatus.Pending);
        descriptor.Artifacts[0].Content.Should().BeEmpty();
        descriptor.Artifacts[0].ContentHash.Should().Be("hash");
        descriptor.Trace.Notes.Add("descriptor change");
        descriptor.Artifacts[0].Metadata["source"] = "changed";

        ArtifactBundle later = (await repository.GetByBundleIdInScopeAsync(
            scope, original.BundleId, loadArtifactBodies: false, CancellationToken.None))!;
        later.Trace.Notes.Should().Equal("initial");
        later.Artifacts[0].Metadata["source"].Should().Be("verified");
    }

    [Fact]
    public async Task GetByManifestIdAsync_rejects_pre_canceled_read()
    {
        InMemoryArtifactBundleRepository repository = new();
        ScopeContext scope = NewScope();
        using CancellationTokenSource canceled = new();
        canceled.Cancel();

        Func<Task> act = async () => await repository.GetByManifestIdAsync(
            scope, Guid.NewGuid(), loadArtifactBodies: true, canceled.Token);
        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    private static ScopeContext NewScope() => new()
    {
        TenantId = Guid.NewGuid(),
        WorkspaceId = Guid.NewGuid(),
        ProjectId = Guid.NewGuid(),
    };

    private static ArtifactBundle NewBundle(ScopeContext scope) => new()
    {
        TenantId = scope.TenantId,
        WorkspaceId = scope.WorkspaceId,
        ProjectId = scope.ProjectId,
        BundleId = Guid.NewGuid(),
        RunId = Guid.NewGuid(),
        ManifestId = Guid.NewGuid(),
        CreatedUtc = DateTime.UtcNow,
        Status = ArtifactBundleStatus.Partial,
        Trace = new SynthesisTrace
        {
            GeneratorsUsed = ["generator"],
            SourceDecisionIds = ["d1"],
            Notes = ["initial"],
        },
        Artifacts =
        [
            new SynthesizedArtifact
            {
                ArtifactId = Guid.NewGuid(),
                ArtifactType = ArtifactType.Inventory,
                Content = "original",
                ContentHash = "hash",
                Status = SynthesizedArtifactGenerationStatus.Pending,
                Metadata = new Dictionary<string, string> { ["source"] = "verified" },
                ContributingDecisionIds = ["d1"],
            }
        ],
    };
}
