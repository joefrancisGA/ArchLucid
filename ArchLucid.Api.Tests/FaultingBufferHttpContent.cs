using System.Net;

namespace ArchLucid.Api.Tests;

internal sealed class FaultingBufferHttpContent : HttpContent
{
    private readonly CancellationTokenSource? _cancellationTokenSource;
    private readonly Exception _exception;

    public FaultingBufferHttpContent(Exception exception, CancellationTokenSource? cancellationTokenSource = null)
    {
        _exception = exception ?? throw new ArgumentNullException(nameof(exception));
        _cancellationTokenSource = cancellationTokenSource;
    }

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
