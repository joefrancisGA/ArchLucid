using System.Threading.Channels;

namespace ArchLucid.Application.Planning.AdvisoryDraft;

public sealed class AdvisoryDraftOperationQueue
{
    private readonly Channel<AdvisoryDraftOperationWorkItem> _channel =
        Channel.CreateBounded<AdvisoryDraftOperationWorkItem>(
            new BoundedChannelOptions(64)
            {
                FullMode = BoundedChannelFullMode.Wait,
                SingleReader = true,
            });

    internal ChannelReader<AdvisoryDraftOperationWorkItem> Reader => _channel.Reader;

    public ValueTask EnqueueAsync(
        AdvisoryDraftOperationWorkItem workItem,
        CancellationToken cancellationToken = default) =>
        _channel.Writer.WriteAsync(workItem, cancellationToken);
}
