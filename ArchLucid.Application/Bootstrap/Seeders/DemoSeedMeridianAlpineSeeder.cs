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

public sealed class DemoSeedMeridianAlpineSeeder : IDemoSeedScenarioSeeder
{
    private readonly DemoSeedSeederDependencies _deps;
    private readonly DemoSeedPersistenceChain _persistence;

    public DemoSeedMeridianAlpineSeeder(DemoSeedSeederDependencies deps, DemoSeedPersistenceChain persistence)
    {
        _deps = deps ?? throw new ArgumentNullException(nameof(deps));
        _persistence = persistence ?? throw new ArgumentNullException(nameof(persistence));
    }

    private static readonly string[] OwnedSteps = ["meridian-alpine-regulated"];

    public IReadOnlyCollection<string> StepNames => OwnedSteps;

    public Task SeedStepAsync(string stepName, CancellationToken cancellationToken) => stepName switch
    {
        "meridian-alpine-regulated" => EnsureMeridianAlpineRegulatedScenarioWorkspaceSeedAsync(_deps.ScopeContextProvider.GetCurrentScope(), cancellationToken),
        _ => throw new ArgumentOutOfRangeException(nameof(stepName), stepName, "Unknown demo seed step."),
    };

    private async Task EnsureMeridianAlpineRegulatedScenarioWorkspaceSeedAsync(ScopeContext contosoBaselineScope, CancellationToken cancellationToken)
    {
        if (contosoBaselineScope.TenantId != ScopeIds.DefaultTenant)
            return;

        Guid ws = DemoRegulatedScenarioWorkspaceIds.WorkspaceRowId(contosoBaselineScope.TenantId);
        Guid scopeProjectId = DemoRegulatedScenarioWorkspaceIds.ProjectScopeRowId(contosoBaselineScope.TenantId);
        ScopeContext workspaceScope = new()
        {
            TenantId = contosoBaselineScope.TenantId,
            WorkspaceId = ws,
            ProjectId = scopeProjectId,
        };

        using (AmbientScopeContext.Push(workspaceScope))
            await EnsureMeridianAlpineRegulatedCommittedScenarioAsync(workspaceScope, cancellationToken);
    }

    private async Task EnsureMeridianAlpineRegulatedCommittedScenarioAsync(ScopeContext scope, CancellationToken cancellationToken)
    {
        Guid runGuid = DemoRegulatedScenarioWorkspaceIds.AuthorityRunId(scope.TenantId);

        if (await _deps.RunRepository.GetByIdAsync(scope, runGuid, cancellationToken) is RunRecord existingTourRun)
        {
            await DemoSeedSeederSupport.TryRepairSeededRunDescriptionAsync(_deps, existingTourRun, cancellationToken);

            return;
        }

        string requestId = DemoRegulatedScenarioWorkspaceIds.ArchitectureRequestId(scope.TenantId);
        await _persistence.EnsureRequestAsync(MeridianAlpineWorkspaceSeed.BuildArchitectureRequest(requestId), cancellationToken);

        string runId = runGuid.ToString("D");
        string demoSuffix = DemoSeedSeederSupport.ProductTourDemoSuffix(scope.TenantId);

        await _persistence.SaveRunAsync(MeridianAlpineWorkspaceSeed.BuildRunRecord(scope, runGuid, requestId), cancellationToken);

        (AgentTask task, AgentResult result) = MeridianAlpineWorkspaceSeed.BuildTopologyWork(runId, demoSuffix);
        await _persistence.SaveTasksAsync([task], cancellationToken);
        await _persistence.SaveResultsAsync([result], cancellationToken);

        GoldenManifest manifest = RegulatedScenarioWorkspaceSeed.BuildManifest(runId);
        IReadOnlyList<Finding> findings = RegulatedScenarioWorkspaceSeed.BuildFindings(runGuid);
        AuthorityChainKeying chainIds = new(
            AuthorityDemoChainIds.Manifest(runGuid),
            AuthorityDemoChainIds.ContextSnapshot(runGuid),
            AuthorityDemoChainIds.GraphSnapshot(runGuid),
            AuthorityDemoChainIds.FindingsSnapshot(runGuid),
            AuthorityDemoChainIds.DecisionTrace(runGuid));

        AuthorityCommittedChainSeedCustomization customization = RegulatedScenarioWorkspaceSeed.BuildCustomization(
            runGuid,
            AuthorityDemoChainIds.GraphSnapshot(runGuid),
            AuthorityDemoChainIds.ContextSnapshot(runGuid),
            RegulatedScenarioWorkspaceSeed.SnapshotUtc);

        AuthorityManifestPersistResult persisted = await _persistence.PersistCommittedChainAsync(
            scope,
            runGuid,
            MeridianAlpineWorkspaceSeed.SystemName,
            manifest,
            chainIds,
            RegulatedScenarioWorkspaceSeed.SnapshotUtc,
            findings,
            "regulated-scenario-demo-seed",
            cancellationToken,
            customization);

        Guid bundleId = DemoRegulatedScenarioWorkspaceIds.ArtifactBundleId(runGuid);
        await _persistence.SaveArtifactBundleAsync(
            MeridianAlpineWorkspaceSeed.BuildArtifactBundle(scope, runGuid, persisted.GoldenManifestId, bundleId),
            cancellationToken);

        await _persistence.CommitRunAsync(
            scope,
            runGuid,
            persisted,
            new DemoSeedRunCommitOptions
            {
                ManifestVersion = RegulatedScenarioWorkspaceSeed.ManifestVersionLiteral,
                CompletedUtc = RegulatedScenarioWorkspaceSeed.SnapshotUtc,
                ArtifactBundleId = bundleId,
            },
            cancellationToken);

        await _persistence.SaveExportRecordAsync(
            MeridianAlpineWorkspaceSeed.BuildExportRecord(runGuid, scope.TenantId),
            cancellationToken);

        if (_deps.Logger.IsEnabled(LogLevel.Information))
            _deps.Logger.LogInformation("Meridian Alpine regulated Workspace B seeded ({RunId}).", runGuid);
    }
}
