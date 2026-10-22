using Microsoft.Coyote.Actors;

namespace ArchLucid.Host.Core.Tests.Coordination;

internal sealed class OutboxLeaseFinalizeCoyoteWorkerInitEvent : Event
{
    public OutboxLeaseFinalizeCoyoteWorkerInitEvent(ActorId controllerId)
    {
        ControllerId = controllerId;
    }

    public ActorId ControllerId { get; }
}
