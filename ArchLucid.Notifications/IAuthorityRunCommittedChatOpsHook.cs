namespace ArchLucid.Notifications;

/// <summary>
///     ChatOps webhook fan-out after authority runs finalize. Per-target delivery failures are logged; when every
///     enabled target fails, <see cref="NotifyAsync" /> throws so Service Bus integration handlers can abandon for retry.
/// </summary>
public interface IAuthorityRunCommittedChatOpsHook
{
    Task NotifyAsync(AuthorityRunCommittedChatOpsNotice notice, CancellationToken cancellationToken);
}
