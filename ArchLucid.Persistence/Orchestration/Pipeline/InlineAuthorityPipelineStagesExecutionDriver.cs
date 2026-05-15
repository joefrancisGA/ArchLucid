namespace ArchLucid.Persistence.Orchestration.Pipeline;

/// <summary>
///     Default driver: runs <see cref="IAuthorityPipelineStagesExecutor.ExecuteAfterRunPersistedAsync" /> on the current
///     unit of work (single SQL transaction with finalize).
/// </summary>
public sealed class InlineAuthorityPipelineStagesExecutionDriver(IAuthorityPipelineStagesExecutor pipelineStagesExecutor)
    : IAuthorityPipelineStagesExecutionDriver
{
    private readonly IAuthorityPipelineStagesExecutor _pipelineStagesExecutor =
        pipelineStagesExecutor ?? throw new ArgumentNullException(nameof(pipelineStagesExecutor));

    /// <inheritdoc />
    public bool RequiresCommittedRunHeaderBeforeStages => false;

    /// <inheritdoc />
    public async Task<AuthorityPipelineStagesExecutionResult> ExecuteStagesAsync(
        AuthorityPipelineContext context,
        CancellationToken cancellationToken)
    {
        await _pipelineStagesExecutor.ExecuteAfterRunPersistedAsync(context, cancellationToken);

        return AuthorityPipelineStagesExecutionResult.NeedsFinalize();
    }
}
