namespace ArchLucid.Core.Persistence.ApplicationPorts.Coordination;

/// <summary>
///     Common recoverable-outbox row shape: identity plus attempt bookkeeping shared by processor bases (TB-920).
/// </summary>
public interface IRecoverableOutboxEntry
{
    Guid OutboxId
    {
        get;
    }

    int AttemptCount
    {
        get;
    }
}
