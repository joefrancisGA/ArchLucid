using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Governance.Preview;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.DecisionTraces;
using ArchLucid.Contracts.Governance.Preview;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

using Xunit;

/// <summary>Validates trusted-baseline Contoso demo seed against the integration test SQL Server database.</summary>
[Trait("Category", "Integration")]
public sealed class DemoSeedServiceTests
{
    [SkippableFact]
    public async Task SeedAsync_inserts_run_records_listable_via_IAuthorityQueryService()
    {
        await using ArchLucidApiFactory factory = new();
        using IServiceScope scope = factory.Services.CreateScope();
        IScopeContextProvider scopeProvider = scope.ServiceProvider.GetRequiredService<IScopeContextProvider>();
        ContosoRetailDemoIds demo = ContosoRetailDemoIds.ForTenant(scopeProvider.GetCurrentScope().TenantId);

        await scope.ServiceProvider.GetRequiredService<IDemoSeedService>().SeedAsync();

        IAuthorityQueryService authority = scope.ServiceProvider.GetRequiredService<IAuthorityQueryService>();
        ScopeContext ctx = scopeProvider.GetCurrentScope();

        IReadOnlyList<RunSummaryDto> rows =
            await authority.ListRunsByProjectAsync(ctx, "Contoso Retail Platform", 50, CancellationToken.None);

        rows.Should().Contain(r => r.RunId == demo.AuthorityRunBaselineId);
        rows.Should().Contain(r => r.RunId == demo.AuthorityRunHardenedId);
        rows.Should().OnlyContain(r => r.ProjectId == "Contoso Retail Platform");
    }

    [SkippableFact]
    public async Task SeedAsync_twice_does_not_throw_and_remains_idempotent()
    {
        await using ArchLucidApiFactory factory = new();
        using IServiceScope scope = factory.Services.CreateScope();
        IDemoSeedService seed = scope.ServiceProvider.GetRequiredService<IDemoSeedService>();
        await seed.SeedAsync();
        Func<Task> second = async () => await seed.SeedAsync();
        await second.Should().NotThrowAsync();
    }

    [SkippableFact]
    public async Task SeedAsync_creates_baseline_and_hardened_runs_with_manifests()
    {
        await using ArchLucidApiFactory factory = new();
        using IServiceScope scope = factory.Services.CreateScope();
        IScopeContextProvider scopeProvider = scope.ServiceProvider.GetRequiredService<IScopeContextProvider>();
        ContosoRetailDemoIds demo = ContosoRetailDemoIds.ForTenant(scopeProvider.GetCurrentScope().TenantId);
        IDemoSeedService seed = scope.ServiceProvider.GetRequiredService<IDemoSeedService>();
        await seed.SeedAsync();

        IRunDetailQueryService detail = scope.ServiceProvider.GetRequiredService<IRunDetailQueryService>();

        ArchitectureRunDetail? baseline = await detail.GetRunDetailAsync(demo.RunBaseline);
        baseline.Should().NotBeNull();
        baseline.Manifest.Should().NotBeNull();
        baseline.Run.CurrentManifestVersion.Should().Be(demo.ManifestBaseline);
        baseline.Results.Should().NotBeEmpty();
        AssertCommittedDemoManifestSnapshotChain(baseline!, demo.AuthorityRunBaselineId);

        ArchitectureRunDetail? hardened = await detail.GetRunDetailAsync(demo.RunHardened);
        hardened.Should().NotBeNull();
        hardened.Manifest.Should().NotBeNull();
        hardened.Run.CurrentManifestVersion.Should().Be(demo.ManifestHardened);
        AssertCommittedDemoManifestSnapshotChain(hardened!, demo.AuthorityRunHardenedId);
    }

    [SkippableFact]
    public async Task SeedAsync_governance_activations_allow_environment_compare_preview()
    {
        await using ArchLucidApiFactory factory = new();
        using IServiceScope scope = factory.Services.CreateScope();
        IDemoSeedService seed = scope.ServiceProvider.GetRequiredService<IDemoSeedService>();
        await seed.SeedAsync();

        IGovernancePreviewService preview = scope.ServiceProvider.GetRequiredService<IGovernancePreviewService>();
        GovernanceEnvironmentComparisonResult result = await preview.CompareEnvironmentsAsync(
            new GovernanceEnvironmentComparisonRequest { SourceEnvironment = "dev", TargetEnvironment = "test" });

        result.Differences.Should().NotBeEmpty("baseline vs hardened governance should differ");
    }

    [SkippableFact]
    public async Task SeedAsync_lists_both_demo_runs_in_run_summaries()
    {
        await using ArchLucidApiFactory factory = new();
        using IServiceScope scope = factory.Services.CreateScope();
        IScopeContextProvider scopeProvider = scope.ServiceProvider.GetRequiredService<IScopeContextProvider>();
        ContosoRetailDemoIds demo = ContosoRetailDemoIds.ForTenant(scopeProvider.GetCurrentScope().TenantId);
        await scope.ServiceProvider.GetRequiredService<IDemoSeedService>().SeedAsync();

        IRunDetailQueryService detail = scope.ServiceProvider.GetRequiredService<IRunDetailQueryService>();
        IReadOnlyList<RunSummary> summaries = await detail.ListRunSummariesAsync();

        summaries.Select(s => s.RunId).Should().Contain(
        [
            demo.RunBaseline,
            demo.RunHardened
        ]);
    }

    [SkippableFact]
    public async Task SeedAsync_manifest_diff_detects_structural_differences_between_versions()
    {
        await using ArchLucidApiFactory factory = new();
        using IServiceScope scope = factory.Services.CreateScope();
        IScopeContextProvider scopeProvider = scope.ServiceProvider.GetRequiredService<IScopeContextProvider>();
        ContosoRetailDemoIds demo = ContosoRetailDemoIds.ForTenant(scopeProvider.GetCurrentScope().TenantId);
        await scope.ServiceProvider.GetRequiredService<IDemoSeedService>().SeedAsync();

        IRunDetailQueryService detail = scope.ServiceProvider.GetRequiredService<IRunDetailQueryService>();
        IManifestDiffService manifestDiff = scope.ServiceProvider.GetRequiredService<IManifestDiffService>();

        ArchitectureRunDetail? baseline = await detail.GetRunDetailAsync(demo.RunBaseline);
        ArchitectureRunDetail? hardened = await detail.GetRunDetailAsync(demo.RunHardened);

        ManifestDiffResult diff = manifestDiff.Compare(baseline!.Manifest!, hardened!.Manifest!);

        bool hasMeaningfulStructuralDiff =
            diff.AddedServices.Count > 0
            || diff.RemovedServices.Count > 0
            || diff.AddedDatastores.Count > 0
            || diff.RemovedDatastores.Count > 0
            || diff.AddedRequiredControls.Count > 0
            || diff.RemovedRequiredControls.Count > 0;

        hasMeaningfulStructuralDiff.Should().BeTrue();
    }

    [SkippableFact]
    public async Task SeedAsync_agent_result_compare_produces_deltas()
    {
        await using ArchLucidApiFactory factory = new();
        using IServiceScope scope = factory.Services.CreateScope();
        IScopeContextProvider scopeProvider = scope.ServiceProvider.GetRequiredService<IScopeContextProvider>();
        ContosoRetailDemoIds demo = ContosoRetailDemoIds.ForTenant(scopeProvider.GetCurrentScope().TenantId);
        await scope.ServiceProvider.GetRequiredService<IDemoSeedService>().SeedAsync();

        IRunDetailQueryService detail = scope.ServiceProvider.GetRequiredService<IRunDetailQueryService>();
        IAgentResultDiffService agentDiff = scope.ServiceProvider.GetRequiredService<IAgentResultDiffService>();

        ArchitectureRunDetail? baseline = await detail.GetRunDetailAsync(demo.RunBaseline);
        ArchitectureRunDetail? hardened = await detail.GetRunDetailAsync(demo.RunHardened);

        AgentResultDiffResult diff = agentDiff.Compare(
            demo.RunBaseline,
            baseline!.Results,
            demo.RunHardened,
            hardened!.Results);

        diff.AgentDeltas.Should().NotBeEmpty();
    }

    [SkippableFact]
    public async Task SeedAsync_seeds_workspace_a_product_tour_run_under_derived_workspace_scope()
    {
        await using ArchLucidApiFactory factory = new();
        using IServiceScope scope = factory.Services.CreateScope();
        IScopeContextProvider scopeProvider = scope.ServiceProvider.GetRequiredService<IScopeContextProvider>();
        Guid tenantId = scopeProvider.GetCurrentScope().TenantId;

        Skip.If(tenantId != ScopeIds.DefaultTenant,
            "Workspace A synthetic tour seed is keyed to ScopeIds.DefaultTenant to avoid cloning demo fixtures onto trial catalogs.");

        Guid tourWorkspaceId = DemoTourWorkspaceIds.WorkspaceRowId(tenantId);
        Guid tourProjectId = DemoTourWorkspaceIds.ProjectScopeRowId(tenantId);
        Guid tourRunId = DemoTourWorkspaceIds.AuthorityRunId(tenantId);

        await scope.ServiceProvider.GetRequiredService<IDemoSeedService>().SeedAsync();

        ScopeContext tourScope = new()
        {
            TenantId = tenantId,
            WorkspaceId = tourWorkspaceId,
            ProjectId = tourProjectId,
        };

        using IDisposable _ = AmbientScopeContext.Push(tourScope);
        IAuthorityQueryService authority = scope.ServiceProvider.GetRequiredService<IAuthorityQueryService>();

        IReadOnlyList<RunSummaryDto> rows =
            await authority.ListRunsByProjectAsync(tourScope, "Contoso Cloud Platform", 50, CancellationToken.None);

        rows.Should().Contain(r => r.RunId == tourRunId);

        IRunDetailQueryService detail = scope.ServiceProvider.GetRequiredService<IRunDetailQueryService>();
        ArchitectureRunDetail? tour = await detail.GetRunDetailAsync(tourRunId.ToString("N"));
        tour.Should().NotBeNull();
        tour!.Manifest.Should().NotBeNull();
        tour.Manifest!.SystemName.Should().Be("Contoso Cloud Platform");
        tour.Run.CurrentManifestVersion.Should().Be("northwind-product-tour-v1-manifest");

        AssertCommittedDemoManifestSnapshotChain(tour, tourRunId);
    }

    /// <summary>
    ///     Validates the authority committed-chain pointers exposed through <see cref="IRunDetailQueryService"/> — the same
    ///     aggregate consumers use — without assuming legacy table names such as <c>dbo.GoldenManifests</c>.
    /// </summary>
    private static void AssertCommittedDemoManifestSnapshotChain(ArchitectureRunDetail detail, Guid expectedAuthorityRunId)
    {
        detail.HasBrokenManifestReference.Should().BeFalse();
        detail.Manifest.Should().NotBeNull();

        detail.Run.RunId.Should().Be(expectedAuthorityRunId.ToString("N"));
        detail.Manifest!.RunId.Should().Be(detail.Run.RunId);

        detail.Run.ContextSnapshotId.Should().NotBeNullOrWhiteSpace();
        detail.Run.GraphSnapshotId.Should().NotBeNull();
        detail.Run.FindingsSnapshotId.Should().NotBeNull();
        detail.Run.GoldenManifestId.Should().NotBeNull();
        detail.Run.DecisionTraceId.Should().NotBeNull();

        detail.DecisionTraces.Should().ContainSingle();
        Guid loadedTraceId = detail.DecisionTraces[0].RequireRuleAudit().DecisionTraceId;
        loadedTraceId.Should().Be(detail.Run.DecisionTraceId!.Value);
    }
}
