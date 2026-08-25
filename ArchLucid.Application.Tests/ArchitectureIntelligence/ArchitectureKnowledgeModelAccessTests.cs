using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using FluentAssertions;
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
  public async Task GetForRunAsync_prefers_CurrentModelId_over_run_scoped_row()
  {
    Guid runId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    Guid architectureId = Guid.Parse("55555555-5555-5555-5555-555555555555");
    string currentModelId = "model-current";

    Mock<IArchitectureIntelligencePersistence> persistence = new();
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
    persistence.Verify(
      p => p.GetModelByRunIdAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
      Times.Never);
  }

  [Fact]
  public async Task SaveForRunAsync_updates_CurrentModelId_pointer()
  {
    Guid runId = Guid.Parse("66666666-6666-6666-6666-666666666666");
    Guid architectureId = Guid.Parse("77777777-7777-7777-7777-777777777777");
    string modelId = "model-after-save";

    Mock<IArchitectureIntelligencePersistence> persistence = new();
    Mock<IRunRepository> runs = new();
    runs
      .Setup(r => r.GetByIdAsync(TestScope, runId, It.IsAny<CancellationToken>()))
      .ReturnsAsync(new RunRecord { RunId = runId, ArchitectureId = architectureId });

    Mock<IArchitectureIdentityRepository> identities = new();

    ArchitectureKnowledgeModelAccess access = new(
      persistence.Object,
      runs.Object,
      identities.Object);

    ArchitectureKnowledgeModel model = new()
    {
      ModelId = modelId,
      TenantId = TestScope.TenantId.ToString("D"),
      RunId = runId.ToString("D"),
    };

    await access.SaveForRunAsync(TestScope, runId, model);

    identities.Verify(
      i => i.UpdateCurrentModelAsync(TestScope, architectureId, modelId, It.IsAny<CancellationToken>()),
      Times.Once);
    persistence.Verify(p => p.SaveModelAsync(model, It.IsAny<CancellationToken>()), Times.Once);
  }
}
