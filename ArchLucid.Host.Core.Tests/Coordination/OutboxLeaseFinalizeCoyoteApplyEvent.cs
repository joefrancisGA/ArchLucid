using Microsoft.Coyote.Actors;

namespace ArchLucid.Host.Core.Tests.Coordination;

internal sealed class OutboxLeaseFinalizeCoyoteApplyEvent : Event
{
    public OutboxLeaseFinalizeCoyoteApplyEvent(OutboxLeaseLifecycleEvent lifecycleEvent, int offsetSeconds)
    {
        LifecycleEvent = lifecycleEvent;
        OffsetSeconds = offsetSeconds;
    }

    public OutboxLeaseLifecycleEvent LifecycleEvent { get; }

    public int OffsetSeconds { get; }
}
