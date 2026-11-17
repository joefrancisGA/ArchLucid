using ArchLucid.Application.Authority;
using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Bootstrap.Seeders;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.UserPreferences;
using ArchLucid.Decisioning.Feasibility;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Repositories;
using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Bootstrap;

[Trait("Category", "Unit")]
public sealed class DemoSeedRetailBaselineSeederLegacyRunIdTests
{
    [Fact]
    public async Task CompareQuality_retail_run_baseline_seed_skips_topology_artifacts_when_results_use_legacy_run_id_key()
    {
        Guid tenantId = ScopeIds.DefaultTenant;
        ContosoRetailDemoIds demo = ContosoRetailDemoIds.ForTenant(tenantId);
        string runIdN = demo.AuthorityRunBaselineId.ToString("N");
        string legacyUpper = runIdN.ToUpperInvariant();

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(scope);

        InMemoryRunRepository runRepository = new();
        await runRepository.SaveAsync(
            new RunRecord
            {
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                RunId = demo.AuthorityRunBaselineId,
                ArchitectureRequestId = demo.RequestId,
                LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
            },
            CancellationToken.None);

        InMemoryAgentResultRepository resultRepository =
            new(new InMemoryAgentResultEnrichmentRepository());
        await resultRepository.CreateAsync(
            new AgentResult
            {
                ResultId = demo.ResultBaseline,
                TaskId = demo.TaskBaseline,
                RunId = legacyUpper,
                AgentType = AgentType.Topology,
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        InMemoryAgentTaskRepository taskRepository = new();

        DemoSeedSeederDependencies deps = new(
            Mock.Of<IArchitectureRequestRepository>(),
            runRepository,
            scopeProvider.Object,
            taskRepository,
            resultRepository,
            Mock.Of<IAuthorityCommittedManifestChainWriter>(),
            Mock.Of<IOptionsMonitor<DemoOptions>>(monitor =>
                monitor.CurrentValue == new DemoOptions()),
            Mock.Of<IGovernanceApprovalRequestRepository>(),
            Mock.Of<IGovernancePromotionRecordRepository>(),
            Mock.Of<IGovernanceEnvironmentActivationRepository>(),
            Mock.Of<IRunExportRecordRepository>(),
            Mock.Of<IArtifactBundleRepository>(),
            Mock.Of<IAuditService>(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            Mock.Of<IAuditRepository>(),
            Mock.Of<IGoldenManifestRepository>(),
            Mock.Of<IAuthorityFeasibilityVerdictComposer>(),
            Mock.Of<IActorContext>(),
            NullLogger.Instance);

        DemoSeedRetailBaselineSeeder seeder = new(deps);

        await seeder.SeedStepAsync("retail-run-baseline", CancellationToken.None);

        IReadOnlyList<AgentResult> resultsAfter =
            await resultRepository.GetByRunIdAsync(scope, legacyUpper, CancellationToken.None);
        resultsAfter.Should().ContainSingle();
        resultsAfter[0].ResultId.Should().Be(demo.ResultBaseline);

        IReadOnlyList<AgentResult> canonicalLookup =
            await resultRepository.GetByRunIdAsync(scope, runIdN, CancellationToken.None);
        canonicalLookup.Should().ContainSingle();
        canonicalLookup[0].ResultId.Should().Be(demo.ResultBaseline);
    }
}
