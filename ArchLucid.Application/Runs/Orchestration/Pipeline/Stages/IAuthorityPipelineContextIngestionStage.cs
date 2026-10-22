namespace ArchLucid.Application.Runs.Orchestration.Pipeline.Stages;

/// <summary>
///     Authority pipeline <c>context_ingestion</c> stage handler.
/// </summary>
public interface IAuthorityPipelineContextIngestionStage
{
    Task ExecuteAsync(AuthorityPipelineContext context, CancellationToken cancellationToken);
}
