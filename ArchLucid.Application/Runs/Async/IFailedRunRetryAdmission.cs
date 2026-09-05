using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Runs.Async;

/// <summary>
///     Moves a Failed run to Retrying as soon as execute is admitted so polls do not keep
///     projecting the previous Failed operation while the async worker is still queued.
/// </summary>
public interface IFailedRunRetryAdmission
{
    Task TryMarkRetryingAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default);
}
