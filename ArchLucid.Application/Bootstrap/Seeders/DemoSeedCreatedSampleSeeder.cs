using System.Threading;

using ArchLucid.Application.Authority;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Bootstrap.Seeders;

public sealed class DemoSeedCreatedSampleSeeder : IDemoSeedScenarioSeeder
{
    private readonly DemoSeedSeederDependencies _deps;
    private readonly DemoSeedPersistenceChain _persistence;

    public DemoSeedCreatedSampleSeeder(DemoSeedSeederDependencies deps, DemoSeedPersistenceChain persistence)
    {
        _deps = deps ?? throw new ArgumentNullException(nameof(deps));
        _persistence = persistence ?? throw new ArgumentNullException(nameof(persistence));
    }

    private static readonly string[] OwnedSteps = ["created-package-sample"];

    public IReadOnlyCollection<string> StepNames => OwnedSteps;

    public Task SeedStepAsync(string stepName, CancellationToken cancellationToken) => stepName switch
    {
        "created-package-sample" => EnsureCreatedArchitecturePackageSampleAsync(_deps.ScopeContextProvider.GetCurrentScope(), cancellationToken),
        _ => throw new ArgumentOutOfRangeException(nameof(stepName), stepName, "Unknown demo seed step."),
    };

    private async Task EnsureCreatedArchitecturePackageSampleAsync(ScopeContext scope, CancellationToken cancellationToken)
    {
        Guid runGuid = DemoCreatedSampleWorkspaceIds.AuthorityRunId(scope.TenantId);

        if (await _deps.RunRepository.GetByIdAsync(scope, runGuid, cancellationToken) is RunRecord existingCreatedSampleRun)
        {
            await DemoSeedSeederSupport.TryRepairSeededRunDescriptionAsync(_deps, existingCreatedSampleRun, cancellationToken);

            return;
        }

        string requestId = DemoCreatedSampleWorkspaceIds.ArchitectureRequestId(scope.TenantId);
        await _persistence.EnsureRequestAsync(CreatedSampleWorkspaceSeed.BuildArchitectureRequest(requestId), cancellationToken);

        string runId = runGuid.ToString("D");
        string demoSuffix = DemoSeedSeederSupport.ProductTourDemoSuffix(scope.TenantId);
        bool isSample = DemoSeedSeederSupport.ShouldMarkSeededRunAsSample(scope.TenantId);

        await _persistence.SaveRunAsync(
            CreatedSampleWorkspaceSeed.BuildRunRecord(scope, runGuid, requestId, isSample),
            cancellationToken);

        (IReadOnlyList<AgentTask> tasks, IReadOnlyList<AgentResult> results) =
            CreatedSampleWorkspaceSeed.BuildAgentWork(runId, demoSuffix);

        await _persistence.SaveTasksAsync(tasks, cancellationToken);
        await _persistence.SaveResultsAsync(results, cancellationToken);

        GoldenManifest manifest = CreatedSampleWorkspaceSeed.BuildManifest(runId);
        IReadOnlyList<Finding> findings = CreatedSampleWorkspaceSeed.BuildFindings(runGuid);
        AuthorityChainKeying chainIds = new(
            AuthorityDemoChainIds.Manifest(runGuid),
            AuthorityDemoChainIds.ContextSnapshot(runGuid),
            AuthorityDemoChainIds.GraphSnapshot(runGuid),
            AuthorityDemoChainIds.FindingsSnapshot(runGuid),
            AuthorityDemoChainIds.DecisionTrace(runGuid));

        AuthorityCommittedChainSeedCustomization customization = CreatedSampleWorkspaceSeed.BuildCustomization(
            runGuid,
            AuthorityDemoChainIds.GraphSnapshot(runGuid),
            AuthorityDemoChainIds.ContextSnapshot(runGuid),
            CreatedSampleWorkspaceSeed.SnapshotUtc);

        AuthorityManifestPersistResult persisted = await _persistence.PersistCommittedChainAsync(
            scope,
            runGuid,
            CreatedSampleWorkspaceSeed.SystemNameLiteral,
            manifest,
            chainIds,
            CreatedSampleWorkspaceSeed.SnapshotUtc,
            findings,
            "created-sample-demo-seed",
            cancellationToken,
            customization);

        Guid bundleId = DemoCreatedSampleWorkspaceIds.ArtifactBundleId(runGuid);
        await _persistence.SaveArtifactBundleAsync(
            CreatedSampleWorkspaceSeed.BuildArtifactBundle(scope, runGuid, persisted.GoldenManifestId, bundleId),
            cancellationToken);

        await _persistence.CommitRunAsync(
            scope,
            runGuid,
            persisted,
            new DemoSeedRunCommitOptions
            {
                ManifestVersion = CreatedSampleWorkspaceSeed.ManifestVersionLiteral,
                CompletedUtc = CreatedSampleWorkspaceSeed.SnapshotUtc,
                ArtifactBundleId = bundleId,
            },
            cancellationToken);

        await _persistence.SaveExportRecordAsync(
            CreatedSampleWorkspaceSeed.BuildExportRecord(runGuid, scope.TenantId),
            cancellationToken);

        if (_deps.Logger.IsEnabled(LogLevel.Information))
            _deps.Logger.LogInformation("Created architecture package sample seeded ({RunId}).", runGuid);
    }
}
