using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Ports;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline.Stages;

/// <inheritdoc cref="IAuthorityPipelineContextIngestionStage" />
public sealed class AuthorityPipelineContextIngestionStage(
    IContextIngestionService contextIngestionService,
    IContextSnapshotRepository contextSnapshotRepository,
    IAuthorityPipelineStagePersistence stagePersistence,
    ILogger<AuthorityPipelineContextIngestionStage> logger) : IAuthorityPipelineContextIngestionStage
{
    private readonly IContextIngestionService _contextIngestionService =
        contextIngestionService ?? throw new ArgumentNullException(nameof(contextIngestionService));

    private readonly IContextSnapshotRepository _contextSnapshotRepository =
        contextSnapshotRepository ?? throw new ArgumentNullException(nameof(contextSnapshotRepository));

    private readonly IAuthorityPipelineStagePersistence _stagePersistence =
        stagePersistence ?? throw new ArgumentNullException(nameof(stagePersistence));

    private readonly ILogger<AuthorityPipelineContextIngestionStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task ExecuteAsync(AuthorityPipelineContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);

        RunRecord run = context.Run;

        context.PriorCommittedContext ??= await _contextSnapshotRepository.GetLatestAsync(context.Request.ProjectId, cancellationToken);

        ContextSnapshot contextSnapshot = await _contextIngestionService.IngestAsync(context.Request, cancellationToken);
        await _stagePersistence.SaveContextAsync(contextSnapshot, context.UnitOfWork, cancellationToken);
        context.ContextSnapshot = contextSnapshot;

        run.ContextSnapshotId = contextSnapshot.SnapshotId;
        await _stagePersistence.UpdateRunAsync(run, context.UnitOfWork, cancellationToken);

        if (_logger.IsEnabled(LogLevel.Debug))
        {
            _logger.LogDebug(
                "Authority pipeline context ingested: RunId={RunId}, ContextSnapshotId={ContextSnapshotId}",
                run.RunId,
                contextSnapshot.SnapshotId);
        }
    }
}
