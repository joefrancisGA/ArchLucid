namespace ArchLucid.Application.Runs.Orchestration.Pipeline.Stages;

/// <summary>
///     Authority pipeline <c>findings</c> stage handler.
/// </summary>
public interface IAuthorityPipelineFindingsStage
{
    Task ExecuteAsync(AuthorityPipelineContext context, CancellationToken cancellationToken);
}
