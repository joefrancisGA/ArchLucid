using ArchLucid.Persistence.Coordination.Projection;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>Optional JSON payload for <c>dbo.PostCommitProjectionOutbox</c> rows (TB-309).</summary>
public sealed class PostCommitProjectionPayload
{
    /// <summary>Project id (N-format) for <see cref="PostCommitProjectionWorkTypes.ReviewCompletedEvent" />.</summary>
    public string? ProjectId
    {
        get;
        init;
    }
}
