using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Moq;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

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

    model.ModelId.Should().NotBe(priorModelId);
    run.KnowledgeModelId.Should().Be(model.ModelId);

    identities.Verify(
      i => i.UpdateCurrentModelAsync(TestScope, architectureId, model.ModelId, It.IsAny<CancellationToken>()),
      Times.Once);
    persistence.Verify(
      p => p.SaveModelAsync(
        It.Is<ArchitectureKnowledgeModel>(saved => saved.ModelId == model.ModelId),
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
  public void AddArchitectureIntelligence_registers_IArchitectureKnowledgeModelAccess()
  {
    ServiceCollection services = new();
    services.AddArchitectureIntelligence();

    services.Should().Contain(static descriptor =>
      descriptor.ServiceType == typeof(IArchitectureKnowledgeModelAccess)
      && descriptor.ImplementationType == typeof(ArchitectureKnowledgeModelAccess)
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
}
