using Microsoft.Coyote.Actors;
using Microsoft.Coyote.Tasks;

namespace ArchLucid.Host.Core.Tests.Coordination;

/// <summary>Coyote actor scenario for outbox lease + finalize DST (Prompt 15).</summary>
internal static class OutboxLeaseFinalizeCoyoteScenario
{
    private const int WorkerCount = 2;

    public static async Task RunAsync(IActorRuntime runtime)
    {
        TaskCompletionSource<bool> completed = TaskCompletionSource.Create<bool>();
        OutboxLeaseFinalizeCoyoteInitEvent initEvent = new()
        {
            InjectDoubleFinalizeBug = OutboxLeaseFinalizeCoyoteBugGate.InjectDoubleFinalizeBug,
            Completed = completed,
            ExpectedWorkerDoneSignals = WorkerCount,
        };

        ActorId controllerId = runtime.CreateActor(typeof(OutboxLeaseFinalizeCoyoteControllerActor), initEvent);

        for (int workerIndex = 0; workerIndex < WorkerCount; workerIndex++)
            runtime.CreateActor(typeof(OutboxLeaseFinalizeCoyoteWorkerActor), controllerId);

        await completed.Task;
    }
}
