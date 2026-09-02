using ArchLucid.Application.Authority;
using ArchLucid.Application.Common;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Bootstrap.Seeders;

public sealed class DemoSeedRunCommitOptions
{
    public required string ManifestVersion { get; init; }

    public required DateTime CompletedUtc { get; init; }

    public Guid? ArtifactBundleId { get; init; }
}

public sealed class DemoSeedPersistenceChain(DemoSeedSeederDependencies deps)
{
    public async Task EnsureRequestAsync(ArchitectureRequest request, CancellationToken cancellationToken)
    {
        if (await deps.RequestRepository.GetByIdAsync(request.RequestId, cancellationToken) is not null)
            return;

        await deps.RequestRepository.CreateAsync(request, cancellationToken);
    }

    public Task SaveRunAsync(RunRecord run, CancellationToken cancellationToken) =>
        deps.RunRepository.SaveAsync(run, cancellationToken);

    public Task SaveTasksAsync(IReadOnlyList<AgentTask> tasks, CancellationToken cancellationToken) =>
        deps.TaskRepository.CreateManyAsync(tasks, cancellationToken);

    public Task SaveResultsAsync(IReadOnlyList<AgentResult> results, CancellationToken cancellationToken) =>
        deps.ResultRepository.CreateManyAsync(results, cancellationToken);

    public async Task<AuthorityManifestPersistResult> PersistCommittedChainAsync(
        ScopeContext scope,
        Guid runId,
        string systemName,
        GoldenManifest manifest,
        AuthorityChainKeying chainKeying,
        DateTime createdUtc,
        IReadOnlyList<Finding> findings,
        string auditSource,
        CancellationToken cancellationToken,
        AuthorityCommittedChainSeedCustomization? seedCustomization = null)
    {
        AuthorityManifestPersistResult chain = await deps.AuthorityCommittedManifestChainWriter
            .PersistCommittedChainAsync(
                scope,
                runId,
                systemName,
                manifest,
                chainKeying,
                createdUtc,
                richFindingsAndGraph: true,
                cancellationToken,
                connection: null,
                transaction: null,
                committedFindingsOverride: findings,
                seedCustomization: seedCustomization)
            .ConfigureAwait(false);

        await AuthorityCommittedChainDurableAudit.TryLogAsync(
            deps.AuditService,
            deps.ScopeContextProvider,
            deps.ActorContext,
            deps.Logger,
            runId,
            systemName,
            chain,
            auditSource,
            richFindingsAndGraph: true,
            cancellationToken);

        return chain;
    }

    public Task SaveArtifactBundleAsync(ArtifactBundle bundle, CancellationToken cancellationToken) =>
        deps.ArtifactBundleRepository.SaveAsync(bundle, cancellationToken);

    public async Task CommitRunAsync(
        ScopeContext scope,
        Guid runId,
        AuthorityManifestPersistResult chain,
        DemoSeedRunCommitOptions options,
        CancellationToken cancellationToken)
    {
        RunRecord? row = await deps.RunRepository.GetByIdAsync(scope, runId, cancellationToken);
        if (row is null)
            return;

        row.LegacyRunStatus = nameof(ArchitectureRunStatus.Committed);
        row.CurrentManifestVersion = options.ManifestVersion;
        row.CompletedUtc = options.CompletedUtc;
        row.ContextSnapshotId = chain.ContextSnapshotId;
        row.GraphSnapshotId = chain.GraphSnapshotId;
        row.FindingsSnapshotId = chain.FindingsSnapshotId;
        row.GoldenManifestId = chain.GoldenManifestId;
        row.DecisionTraceId = chain.DecisionTraceId;

        if (options.ArtifactBundleId.HasValue)
            row.ArtifactBundleId = options.ArtifactBundleId.Value;

        await deps.RunRepository.UpdateAsync(row, cancellationToken);
    }

    public Task SaveExportRecordAsync(RunExportRecord record, CancellationToken cancellationToken) =>
        deps.RunExportRecordRepository.CreateAsync(record, cancellationToken);
}
