using System.Threading.Channels;

namespace ArchLucid.Application.Evidence;

public interface IEvidenceAddedIncrementalReReviewQueue
{
    ValueTask EnqueueAsync(Func<CancellationToken, Task> workItem, CancellationToken cancellationToken = default);

    IAsyncEnumerable<Func<CancellationToken, Task>> ReadAllAsync(CancellationToken cancellationToken);
}

public sealed class EvidenceAddedIncrementalReReviewQueue : IEvidenceAddedIncrementalReReviewQueue
{
    private readonly Channel<Func<CancellationToken, Task>> _channel =
        Channel.CreateUnbounded<Func<CancellationToken, Task>>(
            new UnboundedChannelOptions
            {
                SingleReader = true,
                SingleWriter = false
            });

    public ValueTask EnqueueAsync(Func<CancellationToken, Task> workItem, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(workItem);

        return _channel.Writer.WriteAsync(workItem, cancellationToken);
    }

    public IAsyncEnumerable<Func<CancellationToken, Task>> ReadAllAsync(CancellationToken cancellationToken) =>
        _channel.Reader.ReadAllAsync(cancellationToken);
}
