namespace ArchLucid.Persistence.Orchestration.Pipeline;

/// <summary>
///     Executes authority pipeline stages after <see cref="Models.RunRecord" /> persistence (inline SQL transaction vs
///     durable out-of-band execution).
/// </summary>
public interface IAuthorityPipelineStagesExecutionDriver
{
    /// <summary>
    ///     When <see langword="true" />, the orchestrator commits the ambient unit of work after the run header is saved
    ///     so out-of-band workers can read <c>dbo.Runs</c> before stages execute.
    /// </summary>
    bool RequiresCommittedRunHeaderBeforeStages
    {
        get;
    }

    /// <summary>
    ///     Runs pipeline stages (and optionally external orchestration) for the supplied context.
    /// </summary>
    Task<AuthorityPipelineStagesExecutionResult> ExecuteStagesAsync(
        AuthorityPipelineContext context,
        CancellationToken cancellationToken);
}
