using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Persistence.Ports;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.Graph;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Cosmos;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline.Stages;

/// <inheritdoc cref="IAuthorityPipelineStagePersistence" />
public sealed class AuthorityPipelineStagePersistence(
    IRunRepository runRepository,
    IContextSnapshotRepository contextSnapshotRepository,
    IGraphSnapshotRepository graphSnapshotRepository,
    IGraphSnapshotSqlAuthorityWriter graphSnapshotSqlAuthorityWriter,
    ICosmosGraphSnapshotOutboxRepository cosmosGraphSnapshotOutboxRepository,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    IDecisionTraceRepository decisionTraceRepository,
    IGoldenManifestRepository goldenManifestRepository,
    IArtifactBundleRepository artifactBundleRepository,
    IOptionsMonitor<CosmosDbOptions> cosmosDbOptionsMonitor) : IAuthorityPipelineStagePersistence
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IContextSnapshotRepository _contextSnapshotRepository =
        contextSnapshotRepository ?? throw new ArgumentNullException(nameof(contextSnapshotRepository));

    private readonly IGraphSnapshotRepository _graphSnapshotRepository =
        graphSnapshotRepository ?? throw new ArgumentNullException(nameof(graphSnapshotRepository));

    private readonly IGraphSnapshotSqlAuthorityWriter _graphSnapshotSqlAuthorityWriter =
        graphSnapshotSqlAuthorityWriter ?? throw new ArgumentNullException(nameof(graphSnapshotSqlAuthorityWriter));

    private readonly ICosmosGraphSnapshotOutboxRepository _cosmosGraphSnapshotOutboxRepository =
        cosmosGraphSnapshotOutboxRepository ?? throw new ArgumentNullException(nameof(cosmosGraphSnapshotOutboxRepository));

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly IDecisionTraceRepository _decisionTraceRepository =
        decisionTraceRepository ?? throw new ArgumentNullException(nameof(decisionTraceRepository));

    private readonly IGoldenManifestRepository _goldenManifestRepository =
        goldenManifestRepository ?? throw new ArgumentNullException(nameof(goldenManifestRepository));

    private readonly IArtifactBundleRepository _artifactBundleRepository =
        artifactBundleRepository ?? throw new ArgumentNullException(nameof(artifactBundleRepository));

    private readonly IOptionsMonitor<CosmosDbOptions> _cosmosDbOptionsMonitor =
        cosmosDbOptionsMonitor ?? throw new ArgumentNullException(nameof(cosmosDbOptionsMonitor));

    /// <inheritdoc />
    public async Task UpdateRunAsync(RunRecord run, IArchLucidUnitOfWork unitOfWork, CancellationToken cancellationToken)
    {
        if (unitOfWork.SupportsExternalTransaction)
            await _runRepository.UpdateAsync(run, cancellationToken, unitOfWork.Connection, unitOfWork.Transaction);
        else
            await _runRepository.UpdateAsync(run, cancellationToken);
    }

    /// <inheritdoc />
    public async Task SaveContextAsync(
        ContextSnapshot snapshot,
        IArchLucidUnitOfWork unitOfWork,
        CancellationToken cancellationToken)
    {
        if (unitOfWork.SupportsExternalTransaction)
            await _contextSnapshotRepository.SaveAsync(snapshot, cancellationToken, unitOfWork.Connection, unitOfWork.Transaction);
        else
            await _contextSnapshotRepository.SaveAsync(snapshot, cancellationToken);
    }

    /// <inheritdoc />
    public async Task SaveGraphAsync(
        GraphSnapshot snapshot,
        ScopeContext scope,
        IArchLucidUnitOfWork unitOfWork,
        CancellationToken cancellationToken)
    {
        if (_cosmosDbOptionsMonitor.CurrentValue.GraphSnapshotsEnabled)
        {
            if (unitOfWork.SupportsExternalTransaction)
            {
                await _graphSnapshotSqlAuthorityWriter.SaveAsync(snapshot, cancellationToken, unitOfWork.Connection, unitOfWork.Transaction);
                await _cosmosGraphSnapshotOutboxRepository.EnqueueAsync(
                    snapshot.GraphSnapshotId,
                    snapshot.RunId,
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    unitOfWork.Connection,
                    unitOfWork.Transaction,
                    cancellationToken);
            }
            else
            {
                await _graphSnapshotSqlAuthorityWriter.SaveAsync(snapshot, cancellationToken);
                await _cosmosGraphSnapshotOutboxRepository.EnqueueAsync(
                    snapshot.GraphSnapshotId,
                    snapshot.RunId,
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    cancellationToken);
            }

            return;
        }

        if (unitOfWork.SupportsExternalTransaction)
            await _graphSnapshotRepository.SaveAsync(snapshot, cancellationToken, unitOfWork.Connection, unitOfWork.Transaction);
        else
            await _graphSnapshotRepository.SaveAsync(snapshot, cancellationToken);
    }

    /// <inheritdoc />
    public async Task SaveFindingsAsync(
        FindingsSnapshot snapshot,
        IArchLucidUnitOfWork unitOfWork,
        CancellationToken cancellationToken)
    {
        if (unitOfWork.SupportsExternalTransaction)
            await _findingsSnapshotRepository.SaveAsync(snapshot, cancellationToken, unitOfWork.Connection, unitOfWork.Transaction);
        else
            await _findingsSnapshotRepository.SaveAsync(snapshot, cancellationToken);
    }

    /// <inheritdoc />
    public async Task SaveTraceAsync(
        DecisionTraceDto trace,
        IArchLucidUnitOfWork unitOfWork,
        CancellationToken cancellationToken)
    {
        if (unitOfWork.SupportsExternalTransaction)
            await _decisionTraceRepository.SaveAsync(trace, cancellationToken, unitOfWork.Connection, unitOfWork.Transaction);
        else
            await _decisionTraceRepository.SaveAsync(trace, cancellationToken);
    }

    /// <inheritdoc />
    public async Task SaveManifestAsync(
        ManifestDocument manifest,
        IArchLucidUnitOfWork unitOfWork,
        CancellationToken cancellationToken)
    {
        if (unitOfWork.SupportsExternalTransaction)
            await _goldenManifestRepository.SaveAsync(manifest, cancellationToken, unitOfWork.Connection, unitOfWork.Transaction);
        else
            await _goldenManifestRepository.SaveAsync(manifest, cancellationToken);
    }

    /// <inheritdoc />
    public async Task SaveArtifactBundleAsync(
        ArtifactBundle bundle,
        IArchLucidUnitOfWork unitOfWork,
        CancellationToken cancellationToken)
    {
        if (unitOfWork.SupportsExternalTransaction)
            await _artifactBundleRepository.SaveAsync(bundle, cancellationToken, unitOfWork.Connection, unitOfWork.Transaction);
        else
            await _artifactBundleRepository.SaveAsync(bundle, cancellationToken);
    }
}
