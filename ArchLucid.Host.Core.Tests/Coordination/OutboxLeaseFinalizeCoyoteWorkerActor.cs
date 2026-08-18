using Microsoft.Coyote.Actors;

namespace ArchLucid.Host.Core.Tests.Coordination;

/// <summary>Schedules competing lease/finalize events against the controller actor.</summary>
internal sealed class OutboxLeaseFinalizeCoyoteWorkerActor : Actor
{
    private ActorId _controllerId;

    protected override void OnInitialize(Event initialEvent)
    {
        _controllerId = (ActorId)initialEvent;
    }

    protected override void OnStart()
    {
        Send(_controllerId, new OutboxLeaseFinalizeCoyoteApplyEvent(OutboxLeaseLifecycleEvent.Lease, 0));
        Send(_controllerId, new OutboxLeaseFinalizeCoyoteApplyEvent(OutboxLeaseLifecycleEvent.Crash, 1));
        Send(_controllerId, new OutboxLeaseFinalizeCoyoteApplyEvent(OutboxLeaseLifecycleEvent.Resume, 2));
        Send(_controllerId, new OutboxLeaseFinalizeCoyotePrepareFinalizeEvent());
        Send(_controllerId, new OutboxLeaseFinalizeCoyoteApplyEvent(OutboxLeaseLifecycleEvent.Finalize, 3));
        Send(_controllerId, new OutboxLeaseFinalizeCoyoteApplyEvent(OutboxLeaseLifecycleEvent.LateWrite, 4));
        Send(_controllerId, new OutboxLeaseFinalizeCoyoteApplyEvent(OutboxLeaseLifecycleEvent.Finalize, 5));
        Send(_controllerId, new OutboxLeaseFinalizeCoyoteWorkerDoneEvent());
    }
}
