using Microsoft.Coyote.Actors;
using Microsoft.Coyote.Tasks;

namespace ArchLucid.Host.Core.Tests.Coordination;

internal sealed class OutboxLeaseFinalizeCoyoteInitEvent : Event
{
    public bool InjectDoubleFinalizeBug { get; init; }

    public TaskCompletionSource<bool> Completed { get; init; } = TaskCompletionSource.Create<bool>();

    public int ExpectedWorkerDoneSignals { get; init; }
}
