using ArchLucid.Application.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Transactions;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Agents;

namespace ArchLucid.Application.Tests.Agents;

public sealed class AgentModelCatalogFaithfulnessHarnessImporterTests
{
  [Fact]
  public async Task Import_records_deterministic_evidence_for_each_approved_task_type()
  {
    InMemoryAgentModelCatalogRepository repository = new();
    AgentModelCatalogRow seed = new()
    {
      AliasId = AgentModelAliasIds.StandardGeneral,
      ProviderConnectionKind = AgentModelAliasProviderKinds.ArchLucidManagedAzureOpenAi,
      CapabilityTags = [AgentModelAliasCapabilities.StructuredOutput],
      ApprovedTaskTypes = [AgentModelTaskTypes.Primary, AgentModelTaskTypes.FromAgentType(AgentType.Critic)],
      StructuredOutputLevel = AgentModelStructuredOutputLevel.StrictJsonSchema,
      DataBoundary = AgentModelDataBoundaryKind.AzureBoundary,
      LifecycleStatus = AgentModelCatalogLifecycleStatus.Available,
      Evaluations = []
    };

    await repository.UpsertAsync(seed, CancellationToken.None);

    StubFaithfulnessHarnessSummaryReader reader = new(
      new FaithfulnessHarnessSummary("1.0", 36, 0.9782608695652174, 0.038461538461538464, 0.6388888888888888, 0.8));

    AgentModelCatalogFaithfulnessHarnessImporter importer = new(
      repository,
      reader,
      new AgentModelCatalogEvaluationRecorder(
        repository,
        new NoOpAgentModelCatalogCacheInvalidator(),
        new NoOpAuditService(),
        new FixedScopeContextProvider()));

    AgentModelCatalogRow first = await importer.ImportForAliasAsync(
      AgentModelAliasIds.StandardGeneral,
      "operator@test",
      CancellationToken.None);

    AgentModelCatalogRow second = await importer.ImportForAliasAsync(
      AgentModelAliasIds.StandardGeneral,
      "operator@test",
      CancellationToken.None);

    Assert.Equal(2, first.Evaluations.Count);
    Assert.All(first.Evaluations, evaluation => Assert.Equal(AgentModelEvaluationStateKind.Evaluated, evaluation.EvaluationState));
    Assert.Contains(AgentModelCatalogFaithfulnessHarnessImporter.HarnessScriptName, first.Evaluations[0]?.EvidenceJson ?? string.Empty);
    Assert.Equal(first.Evaluations[0]?.EvaluationState, second.Evaluations[0]?.EvaluationState);
  }

  private sealed class StubFaithfulnessHarnessSummaryReader(FaithfulnessHarnessSummary summary)
    : IFaithfulnessHarnessSummaryReader
  {
    public Task<FaithfulnessHarnessSummary?> TryReadLatestAsync(CancellationToken cancellationToken) =>
      Task.FromResult<FaithfulnessHarnessSummary?>(summary);
  }

  private sealed class NoOpAgentModelCatalogCacheInvalidator : IAgentModelCatalogCacheInvalidator
  {
    public void Invalidate()
    {
    }
  }

  private sealed class NoOpAuditService : IAuditService
  {
    public Task LogAsync(AuditEvent auditEvent, CancellationToken cancellationToken) => Task.CompletedTask;

    public Task LogAsync(AuditEvent auditEvent, IArchLucidUnitOfWork unitOfWork, CancellationToken cancellationToken) =>
      Task.CompletedTask;
  }

  private sealed class FixedScopeContextProvider : IScopeContextProvider
  {
    public ScopeContext GetCurrentScope() =>
      new()
      {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333")
      };
  }
}
