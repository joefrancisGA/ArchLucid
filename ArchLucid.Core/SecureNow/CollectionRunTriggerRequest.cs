namespace ArchLucid.Core.SecureNow;

public sealed record CollectionRunTriggerRequest
{
    public Guid RunId { get; init; }
    public IReadOnlyList<string> SubscriptionIds { get; init; } = [];
}
