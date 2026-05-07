namespace ArchLucid.Application.Audit;
/// <summary>One audit row for operator pipeline timeline (run-scoped).</summary>
public sealed record RunPipelineTimelineItemDto(Guid EventId, DateTime OccurredUtc, string EventType, string ActorUserName, string? CorrelationId)
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(EventType, ActorUserName, CorrelationId);
    private static byte __ValidatePrimaryConstructorArguments(System.String eventType, System.String actorUserName, System.String? correlationId)
    {
        ArgumentNullException.ThrowIfNull(eventType);
        ArgumentNullException.ThrowIfNull(actorUserName);
        return (byte)0;
    }
}