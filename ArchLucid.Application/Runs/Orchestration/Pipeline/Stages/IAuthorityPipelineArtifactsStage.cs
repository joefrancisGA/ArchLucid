namespace ArchLucid.Application.Runs.Orchestration.Pipeline.Stages;

/// <summary>
///     Authority pipeline <c>artifacts</c> stage handler.
/// </summary>
public interface IAuthorityPipelineArtifactsStage
{
    Task ExecuteAsync(AuthorityPipelineContext context, CancellationToken cancellationToken);
}
