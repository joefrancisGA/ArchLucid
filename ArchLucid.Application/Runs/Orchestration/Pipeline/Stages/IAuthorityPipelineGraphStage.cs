namespace ArchLucid.Application.Runs.Orchestration.Pipeline.Stages;

/// <summary>
///     Authority pipeline <c>graph</c> stage handler.
/// </summary>
public interface IAuthorityPipelineGraphStage
{
    Task ExecuteAsync(AuthorityPipelineContext context, CancellationToken cancellationToken);
}
