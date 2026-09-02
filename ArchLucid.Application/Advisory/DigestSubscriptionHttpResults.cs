using ArchLucid.Decisioning.Advisory.Delivery;
using ArchLucid.Decisioning.Advisory.Scheduling;

namespace ArchLucid.Application.Advisory;

public enum DigestSubscriptionHttpOutcome
{
    Success,
    ValidationFailed,
    ResourceNotFound,
}

public sealed record DigestSubscriptionCreateResult
{
    public required DigestSubscriptionHttpOutcome Outcome { get; init; }

    public DigestSubscription? Subscription { get; init; }

    public string? Message { get; init; }
}

public sealed record DigestSubscriptionToggleResult
{
    public required DigestSubscriptionHttpOutcome Outcome { get; init; }

    public DigestSubscription? Subscription { get; init; }
}

public sealed record DigestSubscriptionAttemptsResult
{
    public required DigestSubscriptionHttpOutcome Outcome { get; init; }

    public IReadOnlyList<DigestDeliveryAttempt>? Attempts { get; init; }
}

public sealed record DigestDeliveryAttemptsBatchDto
{
    public required IReadOnlyList<DigestDeliveryAttemptsForDigestDto> Items { get; init; }
}

public sealed record DigestDeliveryAttemptsForDigestDto
{
    public required Guid DigestId { get; init; }

    public required IReadOnlyList<DigestDeliveryAttempt> Attempts { get; init; }
}
