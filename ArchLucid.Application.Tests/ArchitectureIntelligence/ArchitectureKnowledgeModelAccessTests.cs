using ArchLucid.Application.Architecture;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Moq;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ArchitectureKnowledgeModelAccessTests
{
  private static readonly ScopeContext TestScope = new()
  {
    TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
    WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
    ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
  };

  [Fact]
  public async Task GetForRunAsync_prefers_pinned_KnowledgeModelId_over_run_row_and_CurrentModelId()
  {
    Guid runId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    Guid architectureId = Guid.Parse("55555555-5555-5555-5555-555555555555");
    string currentModelId = "model-current";
    string pinnedModelId = "model-pinned";

    Mock<IArchitectureIntelligencePersistence> persistence = new();
    persistence
      .Setup(p => p.GetModelAsync(TestScope.TenantId.ToString("D"), pinnedModelId, It.IsAny<CancellationToken>()))
      .ReturnsAsync(new ArchitectureKnowledgeModel { ModelId = pinnedModelId, TenantId = TestScope.TenantId.ToString("D") });

    Mock<IRunRepository> runs = new();
    runs
      .Setup(r => r.GetByIdAsync(TestScope, runId, It.IsAny<CancellationToken>()))
      .ReturnsAsync(new RunRecord { RunId = runId, ArchitectureId = architectureId, KnowledgeModelId = pinnedModelId });

    Mock<IArchitectureIdentityRepository> identities = new();
    identities
      .Setup(i => i.GetByIdAsync(TestScope, architectureId, It.IsAny<CancellationToken>()))
      .ReturnsAsync(new ArchitectureIdentityRecord
      {
        ArchitectureId = architectureId,
        CurrentModelId = currentModelId,
      });

    ArchitectureKnowledgeModelAccess access = new(
      persistence.Object,
      runs.Object,
      identities.Object);

    ArchitectureKnowledgeModel? model = await access.GetForRunAsync(TestScope, runId);

    model.Should().NotBeNull();
    model!.ModelId.Should().Be(pinnedModelId);
    persistence.Verify(
      p => p.GetModelByRunIdAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
      Times.Never);
  }

  [Fact]
  public async Task GetForRunAsync_falls_back_to_CurrentModelId_when_run_scoped_row_missing()
  {
    Guid runId = Guid.Parse("88888888-8888-8888-8888-888888888888");
    Guid architectureId = Guid.Parse("99999999-9999-9999-9999-999999999999");
    string currentModelId = "model-current";

    Mock<IArchitectureIntelligencePersistence> persistence = new();
    persistence
      .Setup(p => p.GetModelByRunIdAsync(TestScope.TenantId.ToString("D"), runId.ToString("D"), It.IsAny<CancellationToken>()))
      .ReturnsAsync((ArchitectureKnowledgeModel?)null);
    persistence
      .Setup(p => p.GetModelByRunIdAsync(TestScope.TenantId.ToString("D"), runId.ToString("N"), It.IsAny<CancellationToken>()))
      .ReturnsAsync((ArchitectureKnowledgeModel?)null);
    persistence
      .Setup(p => p.GetModelAsync(TestScope.TenantId.ToString("D"), currentModelId, It.IsAny<CancellationToken>()))
      .ReturnsAsync(new ArchitectureKnowledgeModel { ModelId = currentModelId, TenantId = TestScope.TenantId.ToString("D") });

    Mock<IRunRepository> runs = new();
    runs
      .Setup(r => r.GetByIdAsync(TestScope, runId, It.IsAny<CancellationToken>()))
      .ReturnsAsync(new RunRecord { RunId = runId, ArchitectureId = architectureId });
    runs
      .Setup(r => r.GetLatestRunIdForArchitectureAsync(TestScope, architectureId, It.IsAny<CancellationToken>()))
      .ReturnsAsync(runId);

    Mock<IArchitectureIdentityRepository> identities = new();
    identities
      .Setup(i => i.GetByIdAsync(TestScope, architectureId, It.IsAny<CancellationToken>()))
      .ReturnsAsync(new ArchitectureIdentityRecord
      {
        ArchitectureId = architectureId,
        CurrentModelId = currentModelId,
      });

    ArchitectureKnowledgeModelAccess access = new(
      persistence.Object,
      runs.Object,
      identities.Object);

    ArchitectureKnowledgeModel? model = await access.GetForRunAsync(TestScope, runId);

    model.Should().NotBeNull();
    model!.ModelId.Should().Be(currentModelId);
  }

  [Fact]
  public async Task GetForRunAsync_skips_CurrentModelId_fallback_for_non_head_unpinned_run()
  {
    Guid runId = Guid.Parse("11111111-1111-1111-1111-111111111112");
    Guid headRunId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    Guid architectureId = Guid.Parse("99999999-9999-9999-9999-999999999999");

    Mock<IArchitectureIntelligencePersistence> persistence = new();
    persistence
      .Setup(p => p.GetModelByRunIdAsync(TestScope.TenantId.ToString("D"), runId.ToString("D"), It.IsAny<CancellationToken>()))
      .ReturnsAsync((ArchitectureKnowledgeModel?)null);
    persistence
      .Setup(p => p.GetModelByRunIdAsync(TestScope.TenantId.ToString("D"), runId.ToString("N"), It.IsAny<CancellationToken>()))
      .ReturnsAsync((ArchitectureKnowledgeModel?)null);

    Mock<IRunRepository> runs = new();
    runs
      .Setup(r => r.GetByIdAsync(TestScope, runId, It.IsAny<CancellationToken>()))
      .ReturnsAsync(new RunRecord { RunId = runId, ArchitectureId = architectureId });
    runs
      .Setup(r => r.GetLatestRunIdForArchitectureAsync(TestScope, architectureId, It.IsAny<CancellationToken>()))
      .ReturnsAsync(headRunId);

    Mock<IArchitectureIdentityRepository> identities = new();

    ArchitectureKnowledgeModelAccess access = new(
      persistence.Object,
      runs.Object,
      identities.Object);

    ArchitectureKnowledgeModel? model = await access.GetForRunAsync(TestScope, runId);

    model.Should().BeNull();
    identities.Verify(
      i => i.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
      Times.Never);
  }

  [Fact]
  public async Task SaveForRunAsync_mints_new_ModelId_and_updates_CurrentModelId_pointer()
  {
    Guid runId = Guid.Parse("66666666-6666-6666-6666-666666666666");
    Guid architectureId = Guid.Parse("77777777-7777-7777-7777-777777777777");
    string priorModelId = "model-before-save";

    Mock<IArchitectureIntelligencePersistence> persistence = new();
    Mock<IRunRepository> runs = new();
    RunRecord run = new() { RunId = runId, ArchitectureId = architectureId };
    runs
      .Setup(r => r.GetByIdAsync(TestScope, runId, It.IsAny<CancellationToken>()))
      .ReturnsAsync(run);
    runs
      .Setup(r => r.GetLatestRunIdForArchitectureAsync(TestScope, architectureId, It.IsAny<CancellationToken>()))
      .ReturnsAsync(runId);

    Mock<IArchitectureIdentityRepository> identities = new();

    ArchitectureKnowledgeModelAccess access = new(
      persistence.Object,
      runs.Object,
      identities.Object);

    ArchitectureKnowledgeModel model = new()
    {
      ModelId = priorModelId,
      TenantId = TestScope.TenantId.ToString("D"),
      RunId = runId.ToString("D"),
    };

    await access.SaveForRunAsync(TestScope, runId, model);

    model.ModelId.Should().Be(priorModelId);
    run.KnowledgeModelId.Should().NotBe(priorModelId);

    identities.Verify(
      i => i.UpdateCurrentModelAsync(TestScope, architectureId, run.KnowledgeModelId!, It.IsAny<CancellationToken>()),
      Times.Once);
    persistence.Verify(
      p => p.SaveModelAsync(
        It.Is<ArchitectureKnowledgeModel>(saved => saved.ModelId == run.KnowledgeModelId),
        It.IsAny<CancellationToken>()),
      Times.Once);
  }

  [Fact]
  public async Task GetForRunAsync_without_identity_repository_falls_back_to_run_scoped_row()
  {
    Guid runId = Guid.Parse("88888888-8888-8888-8888-888888888888");
    string tenantId = TestScope.TenantId.ToString("D");

    Mock<IArchitectureIntelligencePersistence> persistence = new();
    persistence
      .Setup(p => p.GetModelByRunIdAsync(tenantId, runId.ToString("D"), It.IsAny<CancellationToken>()))
      .ReturnsAsync(new ArchitectureKnowledgeModel { ModelId = "run-model", TenantId = tenantId });

    Mock<IRunRepository> runs = new();

    ArchitectureKnowledgeModelAccess access = new(persistence.Object, runs.Object);

    ArchitectureKnowledgeModel? model = await access.GetForRunAsync(TestScope, runId);

    model.Should().NotBeNull();
    model!.ModelId.Should().Be("run-model");
  }

    [Fact]
    public async Task GetForRunAsync_returns_cloned_model_not_shared_persistence_instance()
    {
        Guid runId = Guid.Parse("99999999-9999-9999-9999-999999999999");
        string tenantId = TestScope.TenantId.ToString("D");
        ArchitectureKnowledgeModel stored = new()
        {
            ModelId = "stored-model",
            TenantId = tenantId,
            RunId = runId.ToString("D"),
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "svc-1",
                    Kind = ArchitectureElementKind.Component,
                    Name = "API",
                },
            ],
        };

        Mock<IArchitectureIntelligencePersistence> persistence = new();
        persistence
            .Setup(p => p.GetModelByRunIdAsync(tenantId, runId.ToString("D"), It.IsAny<CancellationToken>()))
            .ReturnsAsync(stored);

        Mock<IRunRepository> runs = new();

        ArchitectureKnowledgeModelAccess access = new(persistence.Object, runs.Object);

        ArchitectureKnowledgeModel? loaded = await access.GetForRunAsync(TestScope, runId);

        loaded.Should().NotBeSameAs(stored);
        loaded!.Elements[0].Name = "mutated";

        stored.Elements[0].Name.Should().Be("API");
    }

    [Fact]
    public void AddArchitectureIntelligence_registers_IArchitectureKnowledgeModelAccess()
  {
    ServiceCollection services = new();
    services.AddArchitectureIntelligence();

    services.Should().Contain(static descriptor =>
      descriptor.ServiceType == typeof(IArchitectureKnowledgeModelAccess)
      && descriptor.Lifetime == ServiceLifetime.Scoped);
  }

  [Fact]
  public async Task SaveForRunAsync_clears_GraphSnapshotId_so_pipeline_reprojects_graph()
  {
    Guid runId = Guid.Parse("abababab-abab-abab-abab-abababababab");
    Guid graphSnapshotId = Guid.Parse("bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc");

    Mock<IArchitectureIntelligencePersistence> persistence = new();
    Mock<IRunRepository> runs = new();
    RunRecord run = new()
    {
      RunId = runId,
      GraphSnapshotId = graphSnapshotId,
    };

    runs
      .Setup(r => r.GetByIdAsync(TestScope, runId, It.IsAny<CancellationToken>()))
      .ReturnsAsync(run);

    ArchitectureKnowledgeModelAccess access = new(
      persistence.Object,
      runs.Object,
      Mock.Of<IArchitectureIdentityRepository>());

    await access.SaveForRunAsync(
      TestScope,
      runId,
      new ArchitectureKnowledgeModel { TenantId = TestScope.TenantId.ToString("D") });

    run.GraphSnapshotId.Should().BeNull();
    runs.Verify(r => r.UpdateAsync(run, It.IsAny<CancellationToken>()), Times.Once);
  }

  [Fact]
  public async Task SaveForRunAsync_preserves_GraphSnapshotId_when_findings_snapshot_already_exists()
  {
    Guid runId = Guid.Parse("12121212-1212-1212-1212-121212121212");
    Guid graphSnapshotId = Guid.Parse("34343434-3434-3434-3434-343434343434");
    Guid findingsSnapshotId = Guid.Parse("56565656-5656-5656-5656-565656565656");

    Mock<IArchitectureIntelligencePersistence> persistence = new();
    Mock<IRunRepository> runs = new();
    RunRecord run = new()
    {
      RunId = runId,
      GraphSnapshotId = graphSnapshotId,
      FindingsSnapshotId = findingsSnapshotId,
    };

    runs
      .Setup(r => r.GetByIdAsync(TestScope, runId, It.IsAny<CancellationToken>()))
      .ReturnsAsync(run);

    ArchitectureKnowledgeModelAccess access = new(
      persistence.Object,
      runs.Object,
      Mock.Of<IArchitectureIdentityRepository>());

    await access.SaveForRunAsync(
      TestScope,
      runId,
      new ArchitectureKnowledgeModel { TenantId = TestScope.TenantId.ToString("D") });

    run.GraphSnapshotId.Should().Be(graphSnapshotId);
  }

  [Fact]
  public async Task SaveForRunAsync_preserves_GraphSnapshotId_when_golden_manifest_already_sealed()
  {
    Guid runId = Guid.Parse("14141414-1414-1414-1414-141414141414");
    Guid graphSnapshotId = Guid.Parse("15151515-1515-1515-1515-151515151515");
    Guid goldenManifestId = Guid.Parse("16161616-1616-1616-1616-161616161616");

    Mock<IArchitectureIntelligencePersistence> persistence = new();
    Mock<IRunRepository> runs = new();
    RunRecord run = new()
    {
      RunId = runId,
      GraphSnapshotId = graphSnapshotId,
      GoldenManifestId = goldenManifestId,
    };

    runs
      .Setup(r => r.GetByIdAsync(TestScope, runId, It.IsAny<CancellationToken>()))
      .ReturnsAsync(run);

    ArchitectureKnowledgeModelAccess access = new(
      persistence.Object,
      runs.Object,
      Mock.Of<IArchitectureIdentityRepository>());

    await access.SaveForRunAsync(
      TestScope,
      runId,
      new ArchitectureKnowledgeModel { TenantId = TestScope.TenantId.ToString("D") });

    run.GraphSnapshotId.Should().Be(graphSnapshotId);
  }

  [Fact]
  public async Task SaveForRunAsync_restores_in_flight_graph_after_architecture_wide_clear()
  {
    Guid runId = Guid.Parse("78787878-7878-7878-7878-787878787878");
    Guid architectureId = Guid.Parse("90909090-9090-9090-9090-909090909090");
    Guid graphSnapshotId = Guid.Parse("a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1");
    Guid findingsSnapshotId = Guid.Parse("b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2");

    Mock<IArchitectureIntelligencePersistence> persistence = new();
    InMemoryRunRepository runs = new();
    RunRecord run = new()
    {
      RunId = runId,
      TenantId = TestScope.TenantId,
      WorkspaceId = TestScope.WorkspaceId,
      ScopeProjectId = TestScope.ProjectId,
      ProjectId = "GoldenCohortPreserveGraph",
      ArchitectureId = architectureId,
      GraphSnapshotId = graphSnapshotId,
      FindingsSnapshotId = findingsSnapshotId,
      CreatedUtc = DateTime.UtcNow,
    };

    await runs.SaveAsync(run, CancellationToken.None);

    Mock<IArchitectureIdentityRepository> identities = new();

    ArchitectureKnowledgeModelAccess access = new(
      persistence.Object,
      runs,
      identities.Object);

    await access.SaveForRunAsync(
      TestScope,
      runId,
      new ArchitectureKnowledgeModel { TenantId = TestScope.TenantId.ToString("D") });

    run.GraphSnapshotId.Should().Be(graphSnapshotId);
    RunRecord? loaded = await runs.GetByIdAsync(TestScope, runId, CancellationToken.None);
    loaded.Should().NotBeNull();
    loaded!.GraphSnapshotId.Should().Be(graphSnapshotId);
  }

  [Fact]
  public async Task SaveForRunAsync_skips_CurrentModelId_update_when_run_is_not_architecture_head()
  {
    Guid runId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    Guid architectureId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    Guid headRunId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    Mock<IArchitectureIntelligencePersistence> persistence = new();
    Mock<IRunRepository> runs = new();
    RunRecord run = new() { RunId = runId, ArchitectureId = architectureId };
    runs
      .Setup(r => r.GetByIdAsync(TestScope, runId, It.IsAny<CancellationToken>()))
      .ReturnsAsync(run);
    runs
      .Setup(r => r.GetLatestRunIdForArchitectureAsync(TestScope, architectureId, It.IsAny<CancellationToken>()))
      .ReturnsAsync(headRunId);

    Mock<IArchitectureIdentityRepository> identities = new();

    ArchitectureKnowledgeModelAccess access = new(
      persistence.Object,
      runs.Object,
      identities.Object);

    await access.SaveForRunAsync(
      TestScope,
      runId,
      new ArchitectureKnowledgeModel { TenantId = TestScope.TenantId.ToString("D") });

    identities.Verify(
      i => i.UpdateCurrentModelAsync(
        It.IsAny<ScopeContext>(),
        It.IsAny<Guid>(),
        It.IsAny<string>(),
        It.IsAny<CancellationToken>()),
      Times.Never);
  }

  [Fact]
  [Trait("Suite", "Core")]
  public async Task SaveForRunAsync_syncs_architecture_version_pin_after_knowledge_model_save()
  {
    Guid runId = Guid.Parse("f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1");
    Guid architectureId = Guid.Parse("e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2");

    Mock<IArchitectureIntelligencePersistence> persistence = new();
    Mock<IRunRepository> runs = new();
    RunRecord run = new()
    {
      RunId = runId,
      ArchitectureId = architectureId,
      ArchitectureRequestId = "req-golden-cohort",
    };
    runs
      .Setup(r => r.GetByIdAsync(TestScope, runId, It.IsAny<CancellationToken>()))
      .ReturnsAsync(run);

    Mock<IArchitectureVersionKnowledgeModelPinSync> pinSync = new();
    ArchitectureKnowledgeModelAccess access = new(
      persistence.Object,
      runs.Object,
      Mock.Of<IArchitectureIdentityRepository>(),
      knowledgeModelGraphReprojector: null,
      pinSync.Object);

    ArchitectureKnowledgeModel model = new()
    {
      TenantId = TestScope.TenantId.ToString("D"),
      Elements =
      [
        new ArchitectureModelElement
        {
          ElementId = "el-1",
          Kind = ArchitectureElementKind.Component,
          Name = "API",
        },
      ],
    };

    await access.SaveForRunAsync(TestScope, runId, model);

    pinSync.Verify(
      sync => sync.SyncPinnedVersionToSavedModelAsync(
        TestScope,
        run,
        It.Is<ArchitectureKnowledgeModel>(saved =>
          saved.Elements.Count == 1
          && saved.Elements[0].Name == "API"
          && saved.ModelId != model.ModelId),
        It.IsAny<CancellationToken>()),
      Times.Once);
  }
}
