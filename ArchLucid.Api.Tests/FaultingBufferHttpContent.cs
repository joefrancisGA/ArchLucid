using System.Net;

namespace ArchLucid.Api.Tests;

internal sealed class FaultingBufferHttpContent(Exception exception, CancellationTokenSource? cancellationTokenSource = null) : HttpContent
{
    private readonly CancellationTokenSource? _cancellationTokenSource = cancellationTokenSource;
    private readonly Exception _exception = exception ?? throw new ArgumentNullException(nameof(exception));

    protected override Task SerializeToStreamAsync(Stream stream, TransportContext? context)
    {
        _cancellationTokenSource?.Cancel();
        return Task.FromException(_exception);
    }

    protected override bool TryComputeLength(out long length)
    {
        length = -1;
        return false;
    }
}
