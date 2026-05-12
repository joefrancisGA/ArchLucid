namespace ArchLucid.Notifications;

/// <summary>
///     Best-effort ChatOps webhook fan-out after authority runs finalize (exceptions are swallowed by the orchestrator —
///     never fail the architectural commit surface).
/// </summary>
public interface IAuthorityRunCommittedChatOpsHook
{
    Task NotifyAsync(AuthorityRunCommittedChatOpsNotice notice, CancellationToken cancellationToken);
}
