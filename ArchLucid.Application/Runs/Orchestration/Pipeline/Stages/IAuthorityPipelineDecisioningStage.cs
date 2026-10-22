namespace ArchLucid.Application.Runs.Orchestration.Pipeline.Stages;

/// <summary>
///     Authority pipeline <c>decisioning</c> stage handler.
/// </summary>
public interface IAuthorityPipelineDecisioningStage
{
    Task ExecuteAsync(AuthorityPipelineContext context, CancellationToken cancellationToken);
}
