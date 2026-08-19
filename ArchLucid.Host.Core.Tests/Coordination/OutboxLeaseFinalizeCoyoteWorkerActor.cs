using System.Threading.Tasks;

using Microsoft.Coyote.Actors;

namespace ArchLucid.Host.Core.Tests.Coordination;

/// <summary>Schedules competing lease/finalize events against the controller actor.</summary>
internal sealed class OutboxLeaseFinalizeCoyoteWorkerActor : Actor
{
    private ActorId _controllerId = default!;

    protected override Task OnInitializeAsync(Event initialEvent)
    {
        OutboxLeaseFinalizeCoyoteWorkerInitEvent initEvent = (OutboxLeaseFinalizeCoyoteWorkerInitEvent)initialEvent;
        _controllerId = initEvent.ControllerId;

        SendEvent(_controllerId, new OutboxLeaseFinalizeCoyoteApplyEvent(OutboxLeaseLifecycleEvent.Lease, 0));
        SendEvent(_controllerId, new OutboxLeaseFinalizeCoyoteApplyEvent(OutboxLeaseLifecycleEvent.Crash, 1));
        SendEvent(_controllerId, new OutboxLeaseFinalizeCoyoteApplyEvent(OutboxLeaseLifecycleEvent.Resume, 2));
        SendEvent(_controllerId, new OutboxLeaseFinalizeCoyotePrepareFinalizeEvent());
        SendEvent(_controllerId, new OutboxLeaseFinalizeCoyoteApplyEvent(OutboxLeaseLifecycleEvent.Finalize, 3));
        SendEvent(_controllerId, new OutboxLeaseFinalizeCoyoteApplyEvent(OutboxLeaseLifecycleEvent.LateWrite, 4));
        SendEvent(_controllerId, new OutboxLeaseFinalizeCoyoteApplyEvent(OutboxLeaseLifecycleEvent.Finalize, 5));
        SendEvent(_controllerId, new OutboxLeaseFinalizeCoyoteWorkerDoneEvent());

        return Task.CompletedTask;
    }
}
