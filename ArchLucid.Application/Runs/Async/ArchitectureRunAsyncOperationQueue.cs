using System.Threading.Channels;

namespace ArchLucid.Application.Runs.Async;

/// <summary>Bounded in-memory channel for async run operations (TB-2075).</summary>
public sealed class ArchitectureRunAsyncOperationQueue : IArchitectureRunAsyncOperationQueue
{
    private readonly Channel<ArchitectureRunAsyncOperationWorkItem> _channel =
        Channel.CreateBounded<ArchitectureRunAsyncOperationWorkItem>(
            new BoundedChannelOptions(256)
            {
                FullMode = BoundedChannelFullMode.Wait,
                SingleReader = true
            });

    internal ChannelReader<ArchitectureRunAsyncOperationWorkItem> Reader => _channel.Reader;

    public ValueTask EnqueueAsync(
        ArchitectureRunAsyncOperationWorkItem workItem,
        CancellationToken cancellationToken = default) =>
        _channel.Writer.WriteAsync(workItem, cancellationToken);
}
