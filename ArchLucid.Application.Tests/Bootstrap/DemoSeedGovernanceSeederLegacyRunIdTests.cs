using ArchLucid.Application.Authority;
using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Bootstrap.Seeders;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.UserPreferences;
using ArchLucid.Decisioning.Feasibility;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Bootstrap;

[Trait("Category", "Unit")]
public sealed class DemoSeedGovernanceSeederLegacyRunIdTests
{
    [Fact]
    public async Task CompareQuality_retail_governance_seed_skips_duplicate_promotion_when_rows_use_legacy_run_id_key()
    {
        Guid tenantId = ScopeIds.DefaultTenant;
        ContosoRetailDemoIds demo = ContosoRetailDemoIds.ForTenant(tenantId);
        string runIdN = demo.RunHardened;
        string legacyUpper = runIdN.ToUpperInvariant();

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(scope);

        InMemoryGovernanceApprovalRequestRepository approvalRepository = new();
        await approvalRepository.CreateAsync(
            new GovernanceApprovalRequest
            {
                ApprovalRequestId = demo.ApprovalRequest,
                RunId = runIdN,
                ManifestVersion = demo.ManifestHardened,
                SourceEnvironment = GovernanceEnvironment.Dev,
                TargetEnvironment = GovernanceEnvironment.Test,
                Status = GovernanceApprovalStatus.Approved,
            },
            CancellationToken.None);

        InMemoryGovernancePromotionRecordRepository promotionRepository = new();
        await promotionRepository.CreateAsync(
            new GovernancePromotionRecord
            {
                PromotionRecordId = demo.PromotionRecord,
                RunId = legacyUpper,
                ManifestVersion = demo.ManifestHardened,
                SourceEnvironment = GovernanceEnvironment.Dev,
                TargetEnvironment = GovernanceEnvironment.Test,
                PromotedUtc = DateTime.UtcNow,
                ApprovalRequestId = demo.ApprovalRequest,
            },
            CancellationToken.None);

        InMemoryGovernanceEnvironmentActivationRepository activationRepository = new();

        DemoSeedSeederDependencies deps = new(
            Mock.Of<IArchitectureRequestRepository>(),
            Mock.Of<IRunRepository>(),
            scopeProvider.Object,
            Mock.Of<IAgentTaskRepository>(),
            Mock.Of<IAgentResultRepository>(),
            Mock.Of<IAuthorityCommittedManifestChainWriter>(),
            Mock.Of<IOptionsMonitor<DemoOptions>>(monitor => monitor.CurrentValue == new DemoOptions()),
            approvalRepository,
            promotionRepository,
            activationRepository,
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

        DemoSeedGovernanceSeeder seeder = new(deps);

        await seeder.SeedStepAsync("retail-governance", CancellationToken.None);

        IReadOnlyList<GovernancePromotionRecord> promos =
            await promotionRepository.GetByRunIdAsync(legacyUpper, CancellationToken.None);
        promos.Should().ContainSingle();
        promos[0].PromotionRecordId.Should().Be(demo.PromotionRecord);

        IReadOnlyList<GovernancePromotionRecord> canonicalLookup =
            await promotionRepository.GetByRunIdAsync(runIdN, CancellationToken.None);
        canonicalLookup.Should().ContainSingle();
        canonicalLookup[0].PromotionRecordId.Should().Be(demo.PromotionRecord);
    }
}
