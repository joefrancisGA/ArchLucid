using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Orchestration.Pipeline;

/// <summary>
///     Result of executing authority pipeline stages after the run row exists (may or may not include manifest finalize).
/// </summary>
public sealed class AuthorityPipelineStagesExecutionResult
{
    private AuthorityPipelineStagesExecutionResult(
        bool needsFinalizeOnCurrentUnitOfWork,
        RunRecord? completedRun)
    {
        NeedsFinalizeOnCurrentUnitOfWork = needsFinalizeOnCurrentUnitOfWork;
        CompletedRun = completedRun;
    }

    /// <summary>
    ///     When <see langword="true" />, the caller must run <c>FinalizeCommittedPipelineAsync</c> on the current
    ///     <see cref="AuthorityPipelineContext.UnitOfWork" /> using populated context snapshots.
    /// </summary>
    public bool NeedsFinalizeOnCurrentUnitOfWork
    {
        get;
    }

    /// <summary>
    ///     When stages and finalize already committed out-of-band (for example Durable Task activities), the hydrated
    ///     committed run header to return to API callers.
    /// </summary>
    public RunRecord? CompletedRun
    {
        get;
    }

    public static AuthorityPipelineStagesExecutionResult NeedsFinalize()
    {
        return new AuthorityPipelineStagesExecutionResult(needsFinalizeOnCurrentUnitOfWork: true, completedRun: null);
    }

    public static AuthorityPipelineStagesExecutionResult FinishedOutOfBand(RunRecord completedRun)
    {
        ArgumentNullException.ThrowIfNull(completedRun);

        return new AuthorityPipelineStagesExecutionResult(needsFinalizeOnCurrentUnitOfWork: false, completedRun);
    }
}
