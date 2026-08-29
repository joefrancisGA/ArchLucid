using System.Threading.Channels;

namespace ArchLucid.Core.OperationalErrors;

/// <summary>Thread-safe bounded channel for operational error capture; drops when full.</summary>
public sealed class InMemoryOperationalErrorCaptureQueue : IOperationalErrorCaptureQueue
{
    private const int DefaultCapacity = 2000;

    private readonly Channel<OperationalErrorRecord> _channel;

    private int _pending;

    public InMemoryOperationalErrorCaptureQueue()
        : this(DefaultCapacity)
    {
    }

    public InMemoryOperationalErrorCaptureQueue(int capacity)
    {
        if (capacity < 1)
            throw new ArgumentOutOfRangeException(nameof(capacity));

        BoundedChannelOptions options = new(capacity)
        {
            FullMode = BoundedChannelFullMode.DropWrite,
            SingleReader = true,
            SingleWriter = false
        };

        _channel = Channel.CreateBounded<OperationalErrorRecord>(options);
    }

    public long ApproximatePendingCount => Volatile.Read(ref _pending);

    public bool TryEnqueue(OperationalErrorRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        OperationalErrorRecord copy = CopyRecord(record);

        if (!_channel.Writer.TryWrite(copy))
            return false;

        _ = Interlocked.Increment(ref _pending);

        return true;
    }

    public ValueTask<OperationalErrorRecord> DequeueAsync(CancellationToken cancellationToken) =>
        _channel.Reader.ReadAsync(cancellationToken);

    public void NotifyPersistedSuccess() => _ = Interlocked.Decrement(ref _pending);

    public bool TryReturnToQueueAfterFailedDrain(OperationalErrorRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        if (_channel.Writer.TryWrite(CopyRecord(record)))
            return true;

        _ = Interlocked.Decrement(ref _pending);

        return false;
    }

    private static OperationalErrorRecord CopyRecord(OperationalErrorRecord source)
    {
        return new OperationalErrorRecord
        {
            Id = source.Id,
            OccurredUtc = source.OccurredUtc,
            Source = source.Source,
            Category = source.Category,
            HttpStatusCode = source.HttpStatusCode,
            HttpMethod = source.HttpMethod,
            RequestPath = source.RequestPath,
            ProblemType = source.ProblemType,
            ExceptionType = source.ExceptionType,
            Message = source.Message,
            StackTrace = source.StackTrace,
            SqlErrorNumber = source.SqlErrorNumber,
            SqlErrorState = source.SqlErrorState,
            CorrelationId = source.CorrelationId,
            OtelTraceId = source.OtelTraceId,
            TenantId = source.TenantId,
            WorkspaceId = source.WorkspaceId,
            ProjectId = source.ProjectId,
            ActorUserId = source.ActorUserId,
            DetailJson = source.DetailJson
        };
    }
}
