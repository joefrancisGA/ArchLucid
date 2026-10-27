using ArchLucid.Application.Agents;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Core.Runs;
using ArchLucid.Application.Tenancy;
using ArchLucid.Application.Tests.Orchestration;
using ArchLucid.Application.Tests.TestDoubles;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Orchestration;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Orchestration.Pipeline;

[Trait("Category", "Unit")]
public sealed class AuthorityPipelineMaterializeWorkLegacyRunIdTests
{
    [Fact]
    public async Task CompareQuality_MaterializeAgentTasksAsync_merges_technology_ledger_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        string runIdN = runGuid.ToString("N");
        string legacyUpper = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runIdN).ToUpperInvariant();
        DateTime legacyCreatedUtc = DateTime.UtcNow.AddDays(1);

        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

        InMemoryTechnologyLedgerRepository ledgerRepository = new();
        await ledgerRepository.AddAsync(
            new TechnologyLedgerEntry
            {
                RunId = legacyUpper,
                Role = TechnologyLedgerRole.CloudPlatform,
                TechnologyName = "Amazon Web Services",
                ProviderFamily = CloudProvider.Aws,
                Status = TechnologyLedgerStatus.Chosen,
                Source = TechnologyLedgerSource.User,
                CreatedUtc = legacyCreatedUtc,
                UpdatedUtc = legacyCreatedUtc,
            },
            CancellationToken.None);

        ArchitectureRequest request = new()
        {
            RequestId = "REQ-MATERIALIZE-LEGACY",
            SystemName = "LedgerSystem",
            Description = "Design a secure system.",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            RequestSource = "draft-intake",
        };

        EvidenceBundle evidenceBundle = RunStarterTaskFactory.BuildEvidenceBundle(request);

        RunRecord runRecord = new()
        {
            RunId = runGuid,
            ArchitectureRequestId = request.RequestId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
        };

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(r => r.GetByIdAsync(scope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(runRecord);
        runRepository
            .Setup(r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IArchitectureRequestRepository> requestRepository = new();
        requestRepository
            .Setup(r => r.GetByIdAsync(request.RequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);

        Mock<IEvidenceBundleRepository> evidenceRepository = new();
        evidenceRepository
            .Setup(r => r.GetByIdAsync(evidenceBundle.EvidenceBundleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(evidenceBundle);

        List<AgentTask>? capturedTasks = null;
        Mock<IAgentTaskRepository> taskRepository = new();
        taskRepository
            .Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), runIdN, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        taskRepository
            .Setup(r => r.CreateManyAsync(
                It.IsAny<IEnumerable<AgentTask>>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection?>(),
                It.IsAny<System.Data.IDbTransaction?>()))
            .Callback<IEnumerable<AgentTask>, CancellationToken, System.Data.IDbConnection?, System.Data.IDbTransaction?>(
                (tasks, _, _, _) => capturedTasks = tasks.ToList())
            .Returns(Task.CompletedTask);

        IModelExecutionProfileResolver profileResolver = new ModelExecutionProfileResolver(
            new WorkspaceModelExecutionProfileService(
                scopeProvider.Object,
                new InMemoryTenantSettingsRepository()));

        ServiceCollection services = new();
        services.AddLogging();
        services.AddSingleton<ITechnologyLedgerRepository>(ledgerRepository);
        services.AddSingleton(runRepository.Object);
        services.AddSingleton(requestRepository.Object);
        services.AddSingleton(evidenceRepository.Object);
        services.AddSingleton(taskRepository.Object);
        services.AddSingleton(scopeProvider.Object);
        services.AddSingleton(profileResolver);
        services.AddSingleton(Mock.Of<IAuditService>());
        services.AddSingleton<IRunStateTransitionService, RunStateTransitionService>();
        services.AddSingleton(TechnologyLedgerSeederTestDoubles.CreateRequestSeeder(ledgerRepository));
        services.AddSingleton(TechnologyLedgerSeederTestDoubles.CreateEvidenceSeeder(ledgerRepository, scopeProvider.Object));
        services.AddSingleton<IAzureExtractorPackageRepository>(new NoOpAzureExtractorPackageRepository());
        services.AddSingleton<ICloudInventoryExtractorPackageRepository>(new NoOpCloudInventoryExtractorPackageRepository());

        await using ServiceProvider provider = services.BuildServiceProvider();
        await using AsyncServiceScope serviceScope = provider.CreateAsyncScope();

        AuthorityPipelineWorkOutboxEntry entry = new()
        {
            OutboxId = Guid.NewGuid(),
            RunId = runGuid,
        };

        AuthorityPipelineWorkPayload payload = new()
        {
            EvidenceBundleId = evidenceBundle.EvidenceBundleId,
        };

        await AuthorityPipelineMaterializeWork.MaterializeAgentTasksAsync(
            serviceScope,
            entry,
            payload,
            scope,
            NullLogger<AuthorityPipelineExecuteWorkHandler>.Instance,
            CancellationToken.None);

        capturedTasks.Should().NotBeNull();
        AgentTask topology = capturedTasks!.Single(task => task.AgentType == AgentType.Topology);
        topology.Objective.Should().Contain("AWS");
        topology.Objective.Should().NotContain("Azure");
    }

    [Fact]
    public async Task CompareQuality_MaterializeAgentTasksAsync_does_not_duplicate_starter_tasks_when_existing_tasks_use_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string runIdN = runGuid.ToString("N");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runIdN);
        string legacyUpper = canonicalRunId.ToUpperInvariant();

        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

        InMemoryTechnologyLedgerRepository ledgerRepository = new();
        InMemoryAgentTaskRepository taskRepository = new();
        await taskRepository.CreateManyAsync(
            [new AgentTask { TaskId = "legacy-topology", RunId = legacyUpper, AgentType = AgentType.Topology, CreatedUtc = DateTime.UtcNow }],
            CancellationToken.None);

        ArchitectureRequest request = new()
        {
            RequestId = "REQ-MATERIALIZE-TASK-LEGACY",
            SystemName = "TaskSystem",
            Description = "Design a system.",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            RequestSource = "draft-intake",
        };

        EvidenceBundle evidenceBundle = RunStarterTaskFactory.BuildEvidenceBundle(request);

        RunRecord runRecord = new()
        {
            RunId = runGuid,
            ArchitectureRequestId = request.RequestId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
        };

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(r => r.GetByIdAsync(scope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(runRecord);
        runRepository
            .Setup(r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IArchitectureRequestRepository> requestRepository = new();
        requestRepository
            .Setup(r => r.GetByIdAsync(request.RequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);

        Mock<IEvidenceBundleRepository> evidenceRepository = new();
        evidenceRepository
            .Setup(r => r.GetByIdAsync(evidenceBundle.EvidenceBundleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(evidenceBundle);

        IModelExecutionProfileResolver profileResolver = new ModelExecutionProfileResolver(
            new WorkspaceModelExecutionProfileService(
                scopeProvider.Object,
                new InMemoryTenantSettingsRepository()));

        ServiceCollection services = new();
        services.AddLogging();
        services.AddSingleton<ITechnologyLedgerRepository>(ledgerRepository);
        services.AddSingleton<IAgentTaskRepository>(taskRepository);
        services.AddSingleton(runRepository.Object);
        services.AddSingleton(requestRepository.Object);
        services.AddSingleton(evidenceRepository.Object);
        services.AddSingleton(scopeProvider.Object);
        services.AddSingleton(profileResolver);
        services.AddSingleton(Mock.Of<IAuditService>());
        services.AddSingleton<IRunStateTransitionService, RunStateTransitionService>();
        services.AddSingleton(TechnologyLedgerSeederTestDoubles.CreateRequestSeeder(ledgerRepository));
        services.AddSingleton(TechnologyLedgerSeederTestDoubles.CreateEvidenceSeeder(ledgerRepository, scopeProvider.Object));
        services.AddSingleton<IAzureExtractorPackageRepository>(new NoOpAzureExtractorPackageRepository());
        services.AddSingleton<ICloudInventoryExtractorPackageRepository>(new NoOpCloudInventoryExtractorPackageRepository());

        await using ServiceProvider provider = services.BuildServiceProvider();
        await using AsyncServiceScope serviceScope = provider.CreateAsyncScope();

        await AuthorityPipelineMaterializeWork.MaterializeAgentTasksAsync(
            serviceScope,
            new AuthorityPipelineWorkOutboxEntry { OutboxId = Guid.NewGuid(), RunId = runGuid },
            new AuthorityPipelineWorkPayload { EvidenceBundleId = evidenceBundle.EvidenceBundleId },
            scope,
            NullLogger<AuthorityPipelineExecuteWorkHandler>.Instance,
            CancellationToken.None);

        IReadOnlyList<AgentTask> mergedTasks =
            await AnalysisRunIdCanonicalization.LoadAgentTasksByRunIdAsync(
                taskRepository,
                scope,
                canonicalRunId,
                CancellationToken.None);

        mergedTasks.Should().ContainSingle(task => task.TaskId == "legacy-topology");
    }
}
