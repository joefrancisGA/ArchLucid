using System.Threading;

using ArchLucid.Application.Authority;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Bootstrap.Seeders;

public sealed class DemoSeedNorthwindTourSeeder : IDemoSeedScenarioSeeder
{
    private readonly DemoSeedSeederDependencies _deps;
    private readonly DemoSeedPersistenceChain _persistence;

    public DemoSeedNorthwindTourSeeder(DemoSeedSeederDependencies deps, DemoSeedPersistenceChain persistence)
    {
        _deps = deps ?? throw new ArgumentNullException(nameof(deps));
        _persistence = persistence ?? throw new ArgumentNullException(nameof(persistence));
    }

    private static readonly string[] OwnedSteps = ["northwind-product-tour"];

    public IReadOnlyCollection<string> StepNames => OwnedSteps;

    public Task SeedStepAsync(string stepName, CancellationToken cancellationToken) => stepName switch
    {
        "northwind-product-tour" => EnsureNorthwindProductTourWorkspaceSeedAsync(_deps.ScopeContextProvider.GetCurrentScope(), cancellationToken),
        _ => throw new ArgumentOutOfRangeException(nameof(stepName), stepName, "Unknown demo seed step."),
    };

    private async Task EnsureNorthwindProductTourWorkspaceSeedAsync(ScopeContext contosoBaselineScope, CancellationToken cancellationToken)
    {
        if (contosoBaselineScope.TenantId != ScopeIds.DefaultTenant)
            return;

        Guid ws = DemoTourWorkspaceIds.WorkspaceRowId(contosoBaselineScope.TenantId);
        Guid scopeProjectId = DemoTourWorkspaceIds.ProjectScopeRowId(contosoBaselineScope.TenantId);
        ScopeContext workspaceScope = new()
        {
            TenantId = contosoBaselineScope.TenantId,
            WorkspaceId = ws,
            ProjectId = scopeProjectId,
        };

        using (AmbientScopeContext.Push(workspaceScope))
            await EnsureNorthwindProductTourCommittedScenarioAsync(workspaceScope, cancellationToken);
    }

    private async Task EnsureNorthwindProductTourCommittedScenarioAsync(ScopeContext scope, CancellationToken cancellationToken)
    {
        Guid runGuid = DemoTourWorkspaceIds.AuthorityRunId(scope.TenantId);

        if (await _deps.RunRepository.GetByIdAsync(scope, runGuid, cancellationToken) is RunRecord existingTourRun)
        {
            await DemoSeedSeederSupport.TryRepairSeededRunDescriptionAsync(_deps, existingTourRun, cancellationToken);

            return;
        }

        string requestId = DemoTourWorkspaceIds.ArchitectureRequestId(scope.TenantId);
        await _persistence.EnsureRequestAsync(NorthwindTourWorkspaceSeed.BuildArchitectureRequest(requestId), cancellationToken);

        string runId = runGuid.ToString("D");
        string demoSuffix = DemoSeedSeederSupport.ProductTourDemoSuffix(scope.TenantId);

        await _persistence.SaveRunAsync(NorthwindTourWorkspaceSeed.BuildRunRecord(scope, runGuid, requestId), cancellationToken);

        (AgentTask task, AgentResult result) = NorthwindTourWorkspaceSeed.BuildTopologyWork(runId, demoSuffix);
        await _persistence.SaveTasksAsync([task], cancellationToken);
        await _persistence.SaveResultsAsync([result], cancellationToken);

        GoldenManifest manifest = ProductTourWorkspaceSeed.BuildManifest(runId);
        IReadOnlyList<Finding> findings = ProductTourWorkspaceSeed.BuildFindings(runGuid);
        AuthorityChainKeying chainIds = new(
            AuthorityDemoChainIds.Manifest(runGuid),
            AuthorityDemoChainIds.ContextSnapshot(runGuid),
            AuthorityDemoChainIds.GraphSnapshot(runGuid),
            AuthorityDemoChainIds.FindingsSnapshot(runGuid),
            AuthorityDemoChainIds.DecisionTrace(runGuid));

        AuthorityCommittedChainSeedCustomization customization = ProductTourWorkspaceSeed.BuildCustomization(
            runGuid,
            AuthorityDemoChainIds.GraphSnapshot(runGuid),
            AuthorityDemoChainIds.ContextSnapshot(runGuid),
            ProductTourWorkspaceSeed.SnapshotUtc);

        AuthorityManifestPersistResult persisted = await _persistence.PersistCommittedChainAsync(
            scope,
            runGuid,
            NorthwindTourWorkspaceSeed.SystemName,
            manifest,
            chainIds,
            ProductTourWorkspaceSeed.SnapshotUtc,
            findings,
            "product-tour-demo-seed",
            cancellationToken,
            customization);

        Guid bundleId = DemoTourWorkspaceIds.ArtifactBundleId(runGuid);
        await _persistence.SaveArtifactBundleAsync(
            NorthwindTourWorkspaceSeed.BuildArtifactBundle(scope, runGuid, persisted.GoldenManifestId, bundleId),
            cancellationToken);

        await _persistence.CommitRunAsync(
            scope,
            runGuid,
            persisted,
            new DemoSeedRunCommitOptions
            {
                ManifestVersion = ProductTourWorkspaceSeed.ManifestVersionLiteral,
                CompletedUtc = ProductTourWorkspaceSeed.SnapshotUtc,
                ArtifactBundleId = bundleId,
            },
            cancellationToken);

        await _persistence.SaveExportRecordAsync(
            NorthwindTourWorkspaceSeed.BuildExportRecord(runGuid, scope.TenantId),
            cancellationToken);

        if (_deps.Logger.IsEnabled(LogLevel.Information))
            _deps.Logger.LogInformation("Product Tour Workspace A seeded ({RunId}).", runGuid);
    }
}
