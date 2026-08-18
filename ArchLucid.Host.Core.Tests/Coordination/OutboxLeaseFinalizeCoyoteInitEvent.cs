using System.Threading.Tasks;

using Microsoft.Coyote.Actors;

namespace ArchLucid.Host.Core.Tests.Coordination;

internal sealed class OutboxLeaseFinalizeCoyoteInitEvent : Event
{
    public bool InjectDoubleFinalizeBug { get; init; }

    public TaskCompletionSource<bool> Completed { get; init; } = new(TaskCreationOptions.RunContinuationsAsynchronously);

    public int ExpectedWorkerDoneSignals { get; init; }
}
