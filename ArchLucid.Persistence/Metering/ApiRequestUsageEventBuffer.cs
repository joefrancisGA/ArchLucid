using System.Diagnostics.CodeAnalysis;
using System.Threading.Channels;

using ArchLucid.Core.Metering;

using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Metering;

/// <summary>
///     In-memory channel for API request usage events (TB-582). Middleware writes; hosted flush reads.
/// </summary>
public sealed class ApiRequestUsageEventBuffer(IOptionsMonitor<MeteringOptions> options) : IApiRequestUsageEventBuffer
{
    private readonly Channel<UsageEvent> _channel =
        Channel.CreateUnbounded<UsageEvent>(
            new UnboundedChannelOptions { SingleReader = true, SingleWriter = false });

    private readonly IOptionsMonitor<MeteringOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    internal ChannelReader<UsageEvent> Reader => _channel.Reader;

    /// <summary>Removes one queued event when present (used by batch flush hosted service).</summary>
    public bool TryDequeue([NotNullWhen(true)] out UsageEvent? usageEvent) => _channel.Reader.TryRead(out usageEvent);

    /// <inheritdoc />
    public void Enqueue(UsageEvent usageEvent)
    {
        ArgumentNullException.ThrowIfNull(usageEvent);

        if (!_options.CurrentValue.Enabled)
            return;

        _channel.Writer.TryWrite(usageEvent);
    }
}
