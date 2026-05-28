using ArchLucid.Application.Governance;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Roi;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Roi;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ExecutiveRoiBackgroundScopeGuardTests
{
    [Fact]
    public void TryValidate_accepts_explicit_tenant_workspace_project()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        ExecutiveRoiBackgroundScopeGuard.TryValidate(scope, out string reason).Should().BeTrue();
        reason.Should().BeEmpty();
    }

    [Fact]
    public void TryValidate_rejects_dev_default_scope_triple()
    {
        ScopeContext scope = new()
        {
            TenantId = ScopeIds.DefaultTenant,
            WorkspaceId = ScopeIds.DefaultWorkspace,
            ProjectId = ScopeIds.DefaultProject,
        };

        ExecutiveRoiBackgroundScopeGuard.TryValidate(scope, out string reason).Should().BeFalse();
        reason.Should().Be("dev_default_scope_triple");
    }

    [Theory]
    [InlineData("tenant_id_empty", "00000000-0000-0000-0000-000000000000", "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "cccccccc-cccc-cccc-cccc-cccccccccccc")]
    [InlineData("workspace_id_empty", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "00000000-0000-0000-0000-000000000000", "cccccccc-cccc-cccc-cccc-cccccccccccc")]
    [InlineData("project_id_empty", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "00000000-0000-0000-0000-000000000000")]
    public void TryValidate_rejects_empty_scope_dimensions(string expectedReason, string tenantId, string workspaceId, string projectId)
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse(tenantId),
            WorkspaceId = Guid.Parse(workspaceId),
            ProjectId = Guid.Parse(projectId),
        };

        ExecutiveRoiBackgroundScopeGuard.TryValidate(scope, out string reason).Should().BeFalse();
        reason.Should().Be(expectedReason);
    }
}

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ExecutiveRoiBackgroundTenantRollupIsolationTests
{
    private static readonly Guid TenantA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid TenantB = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    [Fact]
    public async Task ForEachActiveTenantAsync_isolates_tenant_rollups_and_rejects_default_scope()
    {
        Mock<ITenantRepository> tenantRepository = CreateTwoTenantRepository();
        Dictionary<Guid, decimal> savingsByTenant = new()
        {
            [TenantA] = 100m,
            [TenantB] = 250m,
        };

        Mock<IRunDetailQueryService> runQuery = CreateTenantScopedRunQuery(savingsByTenant);
        Mock<ITenantEstimatedUsdSavingsResolver> savingsResolver = new();
        savingsResolver
            .Setup(resolver => resolver.ResolveFromFindingsSnapshotIdAsync(It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid? snapshotId, CancellationToken _) =>
            {
                Guid? tenantId = AmbientScopeContext.CurrentOverride?.TenantId;

                if (tenantId is null || snapshotId is null)
                    return null;

                return savingsByTenant.TryGetValue(tenantId.Value, out decimal savings) ? savings : 0m;
            });

        Mock<IScopeContextProvider> ambientScopeProvider = new();
        ambientScopeProvider
            .Setup(provider => provider.GetCurrentScope())
            .Returns(() => AmbientScopeContext.CurrentOverride ?? new ScopeContext());

        Mock<IAzureExtractorPackageRepository> packageRepository = new();
        packageRepository
            .Setup(repo => repo.HasAnyInWorkspaceAsync(It.IsAny<ScopeContext>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        packageRepository
            .Setup(repo => repo.TryGetLatestCollectionTimestampUtcInScopeAsync(It.IsAny<ScopeContext>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((DateTime?)null);

        RoiCostEvidenceFreshnessEvaluator freshnessEvaluator = new(
            packageRepository.Object,
            ambientScopeProvider.Object,
            TimeProvider.System,
            Microsoft.Extensions.Options.Options.Create(new Core.Configuration.RoiCostEvidenceFreshnessOptions()));

        Mock<IFindingsSnapshotRepository> findingsSnapshots = new();
        findingsSnapshots
            .Setup(repo => repo.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext _, Guid snapshotId, CancellationToken _) =>
            {
                Guid? tenantId = AmbientScopeContext.CurrentOverride?.TenantId;

                if (tenantId is null || !savingsByTenant.TryGetValue(tenantId.Value, out decimal savings))
                    return null;

                return ExecutiveRoiSummaryServiceTestSupport.CreateOpenFindingSnapshot(savings);
            });

        Mock<ITenantCostSettingsRepository> tenantCostSettings = new();
        tenantCostSettings
            .Setup(repo => repo.TryGetAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantCostSettingsRecord?)null);

        ExecutiveRoiSummaryService roiService = new(
            runQuery.Object,
            savingsResolver.Object,
            tenantRepository.Object,
            Mock.Of<IScimUserRepository>(),
            CreateAmbientPricingContextResolver(),
            freshnessEvaluator,
            packageRepository.Object,
            ambientScopeProvider.Object,
            CreateEmptyFindingReviewTrailRepository(),
            CreateEmptyRiskExceptionService(),
            CreateEmptyTenantSettingsRepository(),
            findingsSnapshots.Object,
            tenantCostSettings.Object,
            Microsoft.Extensions.Options.Options.Create(new Core.Configuration.ValueReportComputationOptions()),
            NullLogger<ExecutiveRoiSummaryService>.Instance);

        List<(Guid TenantId, decimal TotalUsd)> observed = [];
        int invalidScopeCallbacks = 0;

        int processed = await ExecutiveRoiBackgroundTenantRollup.ForEachActiveTenantAsync(
            tenantRepository.Object,
            async (tenantScope, ct) =>
            {
                ScopeContext ambient = AmbientScopeContext.CurrentOverride
                                       ?? throw new InvalidOperationException("Ambient scope required.");

                if (!ExecutiveRoiBackgroundScopeGuard.TryValidate(ambient, out _))
                {
                    invalidScopeCallbacks++;
                    return;
                }

                ExecutiveRoiSummaryResponse summary = await roiService.BuildAsync(ct);
                observed.Add((ambient.TenantId, summary.TotalEstimatedUsdSavings));
            },
            NullLogger.Instance,
            CancellationToken.None);

        processed.Should().Be(2);
        invalidScopeCallbacks.Should().Be(0);
        observed.Should().BeEquivalentTo(
        [
            (TenantA, 100m),
            (TenantB, 250m),
        ]);
    }

    [Fact]
    public async Task ForEachActiveTenantAsync_skips_tenant_when_workspace_link_missing()
    {
        Guid loneTenant = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Mock<ITenantRepository> tenantRepository = new();
        tenantRepository.Setup(repo => repo.ListAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([CreateTenant(loneTenant)]);
        tenantRepository.Setup(repo => repo.GetFirstWorkspaceAsync(loneTenant, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantWorkspaceLink?)null);

        int callbacks = 0;
        int processed = await ExecutiveRoiBackgroundTenantRollup.ForEachActiveTenantAsync(
            tenantRepository.Object,
            (_, _) =>
            {
                callbacks++;
                return Task.CompletedTask;
            },
            NullLogger.Instance,
            CancellationToken.None);

        processed.Should().Be(0);
        callbacks.Should().Be(0);
    }

    private static Mock<ITenantRepository> CreateTwoTenantRepository()
    {
        Mock<ITenantRepository> tenantRepository = new();
        tenantRepository.Setup(repo => repo.ListAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([CreateTenant(TenantA), CreateTenant(TenantB)]);

        tenantRepository.Setup(repo => repo.GetFirstWorkspaceAsync(TenantA, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantWorkspaceLink
            {
                WorkspaceId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                DefaultProjectId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            });

        tenantRepository.Setup(repo => repo.GetFirstWorkspaceAsync(TenantB, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantWorkspaceLink
            {
                WorkspaceId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                DefaultProjectId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            });

        return tenantRepository;
    }

    private static Mock<IRunDetailQueryService> CreateTenantScopedRunQuery(IReadOnlyDictionary<Guid, decimal> savingsByTenant)
    {
        Dictionary<Guid, (RunSummary Summary, ArchitectureRunDetail Detail, Guid SnapshotId)> byTenant = new();

        foreach (KeyValuePair<Guid, decimal> pair in savingsByTenant)
        {
            Guid tenantId = pair.Key;
            Guid runId = Guid.NewGuid();
            Guid snapshotId = Guid.NewGuid();
            RunSummary summary = new()
            {
                RunId = runId.ToString("N"),
                SystemName = tenantId.ToString("N"),
                Status = nameof(ArchitectureRunStatus.Committed),
                CreatedUtc = new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc),
                CurrentManifestVersion = "v1",
            };

            ArchitectureRunDetail detail = new()
            {
                Run = new ArchitectureRun { RunId = runId.ToString("N"), CompletedUtc = summary.CreatedUtc },
                Manifest = new GoldenManifest
                {
                    RunId = runId.ToString("N"),
                    SystemName = summary.SystemName,
                    Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = summary.CreatedUtc },
                    Governance = new ManifestGovernance(),
                },
                Results = [],
            };

            byTenant[tenantId] = (summary, detail, snapshotId);
        }

        Mock<IRunDetailQueryService> runQuery = new();
        runQuery
            .Setup(query => query.ListRunSummariesKeysetAsync(null, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() =>
            {
                Guid? ambientTenant = AmbientScopeContext.CurrentOverride?.TenantId;

                if (ambientTenant is null || !byTenant.TryGetValue(ambientTenant.Value, out (RunSummary Summary, ArchitectureRunDetail Detail, Guid SnapshotId) row))
                    return (Array.Empty<RunSummary>(), false, (string?)null);

                return ([row.Summary], false, (string?)null);
            });

        runQuery
            .Setup(query => query.GetRunDetailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string runId, CancellationToken _) =>
            {
                Guid? ambientTenant = AmbientScopeContext.CurrentOverride?.TenantId;

                if (ambientTenant is null || !byTenant.TryGetValue(ambientTenant.Value, out (RunSummary Summary, ArchitectureRunDetail Detail, Guid SnapshotId) row))
                    return null;

                if (!string.Equals(row.Summary.RunId, runId, StringComparison.Ordinal))
                    return null;

                row.Detail.Run.FindingsSnapshotId = row.SnapshotId;
                return row.Detail;
            });

        return runQuery;
    }

    private static TenantRecord CreateTenant(Guid tenantId)
    {
        return new TenantRecord
        {
            Id = tenantId,
            Name = tenantId.ToString("N"),
            Slug = tenantId.ToString("N")[..12],
            Tier = TenantTier.Enterprise,
        };
    }

    /// <summary>
    ///     Default-multiplier (1.0 = Retail list) pricing resolver that reads the ambient scope
    ///     pushed by <see cref="ExecutiveRoiBackgroundTenantRollup.ForEachActiveTenantAsync"/>, so the
    ///     resolver runs under the same per-tenant scope as the rest of the ROI service under test.
    /// </summary>
    private static ExecutiveRoiTenantPricingContextResolver CreateAmbientPricingContextResolver()
    {
        Mock<ITenantCostSettingsRepository> repository = new();
        repository
            .Setup(repo => repo.TryGetAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantCostSettingsRecord?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(provider => provider.GetCurrentScope())
            .Returns(() => AmbientScopeContext.CurrentOverride ?? new ScopeContext());

        return new ExecutiveRoiTenantPricingContextResolver(repository.Object, scopeProvider.Object);
    }

    private static IScopeContextProvider CreateAmbientScopeContextProvider()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(provider => provider.GetCurrentScope())
            .Returns(() => AmbientScopeContext.CurrentOverride ?? new ScopeContext());

        return scopeProvider.Object;
    }

    private static IFindingReviewTrailRepository CreateEmptyFindingReviewTrailRepository()
    {
        Mock<IFindingReviewTrailRepository> repository = new();
        repository
            .Setup(repo => repo.ListSinceUtcAsync(It.IsAny<Guid>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        return repository.Object;
    }

    private static IRiskExceptionService CreateEmptyRiskExceptionService()
    {
        Mock<IRiskExceptionService> service = new();
        service
            .Setup(s => s.ListActiveAsync(It.IsAny<Guid>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<RiskExceptionRecord>());
        service
            .Setup(s => s.ListRetiredSinceAsync(It.IsAny<Guid>(), It.IsAny<Guid?>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<RiskExceptionRecord>());

        return service.Object;
    }

    private static ITenantSettingsRepository CreateEmptyTenantSettingsRepository()
    {
        Mock<ITenantSettingsRepository> repository = new();
        repository
            .Setup(repo => repo.TryGetAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);

        return repository.Object;
    }
}
