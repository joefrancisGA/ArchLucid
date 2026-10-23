using ArchLucid.Application.Agents;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Transactions;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Agents;

namespace ArchLucid.Application.Tests.Agents;

[Trait("Suite", "Core")]
public sealed class AgentModelCatalogFaithfulnessHarnessImporterTests
{
  [Fact]
  public async Task Import_trims_surrounding_whitespace_on_alias_id()
  {
    InMemoryAgentModelCatalogRepository repository = new();
    AgentModelCatalogRow seed = new()
    {
      AliasId = AgentModelAliasIds.StandardGeneral,
      ProviderConnectionKind = AgentModelAliasProviderKinds.ArchLucidManagedAzureOpenAi,
      CapabilityTags = [AgentModelAliasCapabilities.StructuredOutput],
      ApprovedTaskTypes = [AgentModelTaskTypes.Primary],
      StructuredOutputLevel = AgentModelStructuredOutputLevel.StrictJsonSchema,
      DataBoundary = AgentModelDataBoundaryKind.AzureBoundary,
      LifecycleStatus = AgentModelCatalogLifecycleStatus.Available,
      Evaluations = []
    };

    await repository.UpsertAsync(seed, CancellationToken.None);

    AgentModelCatalogFaithfulnessHarnessImporter importer = new(
      repository,
      new StubFaithfulnessHarnessSummaryReader(
        new FaithfulnessHarnessSummary("1.0", 36, 0.9, 0.1, 0.5, 0.8)),
      new AgentModelCatalogEvaluationRecorder(
        repository,
        new NoOpAgentModelCatalogCacheInvalidator(),
        new NoOpAuditService(),
        new FixedScopeContextProvider(),
        new FixedActorContext("operator@test")));

    AgentModelCatalogRow saved = await importer.ImportForAliasAsync(
      $"  {AgentModelAliasIds.StandardGeneral}  ",
      "operator@test",
      CancellationToken.None);

    Assert.Single(saved.Evaluations);
    Assert.Equal(AgentModelEvaluationStateKind.Evaluated, saved.Evaluations[0].EvaluationState);
  }

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
        new FixedScopeContextProvider(),
        new FixedActorContext("operator@test")));

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

  [Fact]
  public async Task Import_rejects_summary_when_support_ratios_are_not_finite()
  {
    InMemoryAgentModelCatalogRepository repository = new();
    AgentModelCatalogRow seed = new()
    {
      AliasId = AgentModelAliasIds.StandardGeneral,
      ProviderConnectionKind = AgentModelAliasProviderKinds.ArchLucidManagedAzureOpenAi,
      CapabilityTags = [AgentModelAliasCapabilities.StructuredOutput],
      ApprovedTaskTypes = [AgentModelTaskTypes.Primary],
      StructuredOutputLevel = AgentModelStructuredOutputLevel.StrictJsonSchema,
      DataBoundary = AgentModelDataBoundaryKind.AzureBoundary,
      LifecycleStatus = AgentModelCatalogLifecycleStatus.Available,
      Evaluations = []
    };

    await repository.UpsertAsync(seed, CancellationToken.None);

    AgentModelCatalogFaithfulnessHarnessImporter importer = new(
      repository,
      new StubFaithfulnessHarnessSummaryReader(
        new FaithfulnessHarnessSummary("1.0", 36, double.NaN, 0.0, 0.0, 0.8)),
      new AgentModelCatalogEvaluationRecorder(
        repository,
        new NoOpAgentModelCatalogCacheInvalidator(),
        new NoOpAuditService(),
        new FixedScopeContextProvider(),
        new FixedActorContext("operator@test")));

    InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
      importer.ImportForAliasAsync(
        AgentModelAliasIds.StandardGeneral,
        "operator@test",
        CancellationToken.None));

    Assert.Contains("non-finite", exception.Message, StringComparison.OrdinalIgnoreCase);

    AgentModelCatalogRow? saved = await repository.TryGetAsync(AgentModelAliasIds.StandardGeneral, CancellationToken.None);

    Assert.NotNull(saved);
    Assert.Empty(saved.Evaluations);
  }

  [Fact]
  public async Task Import_rejects_summary_when_readiness_ratio_is_out_of_unit_interval()
  {
    InMemoryAgentModelCatalogRepository repository = new();
    AgentModelCatalogRow seed = new()
    {
      AliasId = AgentModelAliasIds.StandardGeneral,
      ProviderConnectionKind = AgentModelAliasProviderKinds.ArchLucidManagedAzureOpenAi,
      CapabilityTags = [AgentModelAliasCapabilities.StructuredOutput],
      ApprovedTaskTypes = [AgentModelTaskTypes.Primary],
      StructuredOutputLevel = AgentModelStructuredOutputLevel.StrictJsonSchema,
      DataBoundary = AgentModelDataBoundaryKind.AzureBoundary,
      LifecycleStatus = AgentModelCatalogLifecycleStatus.Available,
      Evaluations = []
    };

    await repository.UpsertAsync(seed, CancellationToken.None);

    AgentModelCatalogFaithfulnessHarnessImporter importer = new(
      repository,
      new StubFaithfulnessHarnessSummaryReader(
        new FaithfulnessHarnessSummary("1.0", 36, -0.1, 0.1, 0.5, 0.8)),
      new AgentModelCatalogEvaluationRecorder(
        repository,
        new NoOpAgentModelCatalogCacheInvalidator(),
        new NoOpAuditService(),
        new FixedScopeContextProvider(),
        new FixedActorContext("operator@test")));

    InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
      importer.ImportForAliasAsync(
        AgentModelAliasIds.StandardGeneral,
        "operator@test",
        CancellationToken.None));

    Assert.Contains("[0,1]", exception.Message, StringComparison.Ordinal);

    AgentModelCatalogRow? saved = await repository.TryGetAsync(AgentModelAliasIds.StandardGeneral, CancellationToken.None);

    Assert.NotNull(saved);
    Assert.Empty(saved.Evaluations);
  }

  [Fact]
  public async Task Import_rejects_summary_when_combined_diagnostic_ratio_is_not_finite()
  {
    InMemoryAgentModelCatalogRepository repository = new();
    AgentModelCatalogRow seed = new()
    {
      AliasId = AgentModelAliasIds.StandardGeneral,
      ProviderConnectionKind = AgentModelAliasProviderKinds.ArchLucidManagedAzureOpenAi,
      CapabilityTags = [AgentModelAliasCapabilities.StructuredOutput],
      ApprovedTaskTypes = [AgentModelTaskTypes.Primary],
      StructuredOutputLevel = AgentModelStructuredOutputLevel.StrictJsonSchema,
      DataBoundary = AgentModelDataBoundaryKind.AzureBoundary,
      LifecycleStatus = AgentModelCatalogLifecycleStatus.Available,
      Evaluations = []
    };

    await repository.UpsertAsync(seed, CancellationToken.None);

    AgentModelCatalogFaithfulnessHarnessImporter importer = new(
      repository,
      new StubFaithfulnessHarnessSummaryReader(
        new FaithfulnessHarnessSummary("1.0", 36, 0.9, 0.1, double.NaN, 0.8)),
      new AgentModelCatalogEvaluationRecorder(
        repository,
        new NoOpAgentModelCatalogCacheInvalidator(),
        new NoOpAuditService(),
        new FixedScopeContextProvider(),
        new FixedActorContext("operator@test")));

    InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
      importer.ImportForAliasAsync(
        AgentModelAliasIds.StandardGeneral,
        "operator@test",
        CancellationToken.None));

    Assert.Contains("non-finite", exception.Message, StringComparison.OrdinalIgnoreCase);

    AgentModelCatalogRow? saved = await repository.TryGetAsync(AgentModelAliasIds.StandardGeneral, CancellationToken.None);

    Assert.NotNull(saved);
    Assert.Empty(saved.Evaluations);
  }

  [Fact]
  public async Task Import_rejects_summary_when_cases_evaluated_is_zero()
  {
    InMemoryAgentModelCatalogRepository repository = new();
    AgentModelCatalogRow seed = new()
    {
      AliasId = AgentModelAliasIds.StandardGeneral,
      ProviderConnectionKind = AgentModelAliasProviderKinds.ArchLucidManagedAzureOpenAi,
      CapabilityTags = [AgentModelAliasCapabilities.StructuredOutput],
      ApprovedTaskTypes = [AgentModelTaskTypes.Primary],
      StructuredOutputLevel = AgentModelStructuredOutputLevel.StrictJsonSchema,
      DataBoundary = AgentModelDataBoundaryKind.AzureBoundary,
      LifecycleStatus = AgentModelCatalogLifecycleStatus.Available,
      Evaluations = []
    };

    await repository.UpsertAsync(seed, CancellationToken.None);

    AgentModelCatalogFaithfulnessHarnessImporter importer = new(
      repository,
      new StubFaithfulnessHarnessSummaryReader(
        new FaithfulnessHarnessSummary("1.0", 0, 1.0, 0.0, 0.0, 0.0)),
      new AgentModelCatalogEvaluationRecorder(
        repository,
        new NoOpAgentModelCatalogCacheInvalidator(),
        new NoOpAuditService(),
        new FixedScopeContextProvider(),
        new FixedActorContext("operator@test")));

    InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
      importer.ImportForAliasAsync(
        AgentModelAliasIds.StandardGeneral,
        "operator@test",
        CancellationToken.None));

    Assert.Contains("cases", exception.Message, StringComparison.OrdinalIgnoreCase);

    AgentModelCatalogRow? saved = await repository.TryGetAsync(AgentModelAliasIds.StandardGeneral, CancellationToken.None);

    Assert.NotNull(saved);
    Assert.Empty(saved.Evaluations);
  }

  [Fact]
  public async Task Import_rejects_summary_when_positive_readiness_ratio_is_not_finite()
  {
    InMemoryAgentModelCatalogRepository repository = new();
    AgentModelCatalogRow seed = new()
    {
      AliasId = AgentModelAliasIds.StandardGeneral,
      ProviderConnectionKind = AgentModelAliasProviderKinds.ArchLucidManagedAzureOpenAi,
      CapabilityTags = [AgentModelAliasCapabilities.StructuredOutput],
      ApprovedTaskTypes = [AgentModelTaskTypes.Primary],
      StructuredOutputLevel = AgentModelStructuredOutputLevel.StrictJsonSchema,
      DataBoundary = AgentModelDataBoundaryKind.AzureBoundary,
      LifecycleStatus = AgentModelCatalogLifecycleStatus.Available,
      Evaluations = []
    };

    await repository.UpsertAsync(seed, CancellationToken.None);

    AgentModelCatalogFaithfulnessHarnessImporter importer = new(
      repository,
      new StubFaithfulnessHarnessSummaryReader(
        new FaithfulnessHarnessSummary("1.0", 36, double.PositiveInfinity, 0.0, 0.0, 0.8)),
      new AgentModelCatalogEvaluationRecorder(
        repository,
        new NoOpAgentModelCatalogCacheInvalidator(),
        new NoOpAuditService(),
        new FixedScopeContextProvider(),
        new FixedActorContext("operator@test")));

    InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
      importer.ImportForAliasAsync(
        AgentModelAliasIds.StandardGeneral,
        "operator@test",
        CancellationToken.None));

    Assert.Contains("non-finite", exception.Message, StringComparison.OrdinalIgnoreCase);

    AgentModelCatalogRow? saved = await repository.TryGetAsync(AgentModelAliasIds.StandardGeneral, CancellationToken.None);

    Assert.NotNull(saved);
    Assert.Empty(saved.Evaluations);
  }

  [Fact]
  public async Task Import_records_failed_evaluation_when_readiness_is_strictly_below_floor()
  {
    InMemoryAgentModelCatalogRepository repository = new();
    AgentModelCatalogRow seed = new()
    {
      AliasId = AgentModelAliasIds.StandardGeneral,
      ProviderConnectionKind = AgentModelAliasProviderKinds.ArchLucidManagedAzureOpenAi,
      CapabilityTags = [AgentModelAliasCapabilities.StructuredOutput],
      ApprovedTaskTypes = [AgentModelTaskTypes.Primary],
      StructuredOutputLevel = AgentModelStructuredOutputLevel.StrictJsonSchema,
      DataBoundary = AgentModelDataBoundaryKind.AzureBoundary,
      LifecycleStatus = AgentModelCatalogLifecycleStatus.Available,
      Evaluations = []
    };

    await repository.UpsertAsync(seed, CancellationToken.None);

    AgentModelCatalogFaithfulnessHarnessImporter importer = new(
      repository,
      new StubFaithfulnessHarnessSummaryReader(
        new FaithfulnessHarnessSummary("1.0", 36, 0.79, 0.1, 0.5, 0.8)),
      new AgentModelCatalogEvaluationRecorder(
        repository,
        new NoOpAgentModelCatalogCacheInvalidator(),
        new NoOpAuditService(),
        new FixedScopeContextProvider(),
        new FixedActorContext("operator@test")));

    AgentModelCatalogRow saved = await importer.ImportForAliasAsync(
      AgentModelAliasIds.StandardGeneral,
      "operator@test",
      CancellationToken.None);

    Assert.Single(saved.Evaluations);
    Assert.Equal(AgentModelEvaluationStateKind.Failed, saved.Evaluations[0].EvaluationState);
  }

  [Fact]
  public async Task Import_records_evaluated_when_readiness_equals_floor()
  {
    InMemoryAgentModelCatalogRepository repository = new();
    AgentModelCatalogRow seed = new()
    {
      AliasId = AgentModelAliasIds.StandardGeneral,
      ProviderConnectionKind = AgentModelAliasProviderKinds.ArchLucidManagedAzureOpenAi,
      CapabilityTags = [AgentModelAliasCapabilities.StructuredOutput],
      ApprovedTaskTypes = [AgentModelTaskTypes.Primary],
      StructuredOutputLevel = AgentModelStructuredOutputLevel.StrictJsonSchema,
      DataBoundary = AgentModelDataBoundaryKind.AzureBoundary,
      LifecycleStatus = AgentModelCatalogLifecycleStatus.Available,
      Evaluations = []
    };

    await repository.UpsertAsync(seed, CancellationToken.None);

    AgentModelCatalogFaithfulnessHarnessImporter importer = new(
      repository,
      new StubFaithfulnessHarnessSummaryReader(
        new FaithfulnessHarnessSummary("1.0", 36, 0.8, 0.1, 0.5, 0.8)),
      new AgentModelCatalogEvaluationRecorder(
        repository,
        new NoOpAgentModelCatalogCacheInvalidator(),
        new NoOpAuditService(),
        new FixedScopeContextProvider(),
        new FixedActorContext("operator@test")));

    AgentModelCatalogRow saved = await importer.ImportForAliasAsync(
      AgentModelAliasIds.StandardGeneral,
      "operator@test",
      CancellationToken.None);

    Assert.Single(saved.Evaluations);
    Assert.Equal(AgentModelEvaluationStateKind.Evaluated, saved.Evaluations[0].EvaluationState);
  }

  [Fact]
  public async Task Import_rejects_alias_when_no_approved_task_type_can_take_harness_evidence()
  {
    InMemoryAgentModelCatalogRepository repository = new();
    AgentModelCatalogRow seed = new()
    {
      AliasId = AgentModelAliasIds.StandardGeneral,
      ProviderConnectionKind = AgentModelAliasProviderKinds.ArchLucidManagedAzureOpenAi,
      CapabilityTags = [AgentModelAliasCapabilities.StructuredOutput],
      ApprovedTaskTypes = [],
      StructuredOutputLevel = AgentModelStructuredOutputLevel.StrictJsonSchema,
      DataBoundary = AgentModelDataBoundaryKind.AzureBoundary,
      LifecycleStatus = AgentModelCatalogLifecycleStatus.Available,
      Evaluations = []
    };

    await repository.UpsertAsync(seed, CancellationToken.None);

    AgentModelCatalogFaithfulnessHarnessImporter importer = new(
      repository,
      new StubFaithfulnessHarnessSummaryReader(
        new FaithfulnessHarnessSummary("1.0", 36, 0.9782608695652174, 0.038461538461538464, 0.6388888888888888, 0.8)),
      new AgentModelCatalogEvaluationRecorder(
        repository,
        new NoOpAgentModelCatalogCacheInvalidator(),
        new NoOpAuditService(),
        new FixedScopeContextProvider(),
        new FixedActorContext("operator@test")));

    InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
      importer.ImportForAliasAsync(
        AgentModelAliasIds.StandardGeneral,
        "operator@test",
        CancellationToken.None));

    Assert.Contains("approved task", exception.Message, StringComparison.OrdinalIgnoreCase);

    AgentModelCatalogRow? saved = await repository.TryGetAsync(AgentModelAliasIds.StandardGeneral, CancellationToken.None);

    Assert.NotNull(saved);
    Assert.Empty(saved.Evaluations);
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

  private sealed class FixedActorContext(string actorId) : IActorContext
  {
    public string GetActor() => actorId;

    public string GetActorId() => actorId;

    public string? TryGetSubmitterMailbox() => null;
  }
}
