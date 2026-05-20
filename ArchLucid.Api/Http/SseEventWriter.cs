using System.Text;

namespace ArchLucid.Api.Http;

/// <summary>
///     Writes single Server-Sent Events frames to an HTTP response body.
/// </summary>
public static class SseEventWriter
{
    /// <summary>Writes one SSE event (id, event name, data payload) and flushes the stream.</summary>
    public static async Task WriteAsync(
        Stream body,
        string eventName,
        string data,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(body);
        ArgumentException.ThrowIfNullOrWhiteSpace(eventName);

        string id = Guid.NewGuid().ToString("N");
        StringBuilder sb = new();
        sb.Append("id: ").Append(id).Append('\n');
        sb.Append("event: ").Append(eventName).Append('\n');
        sb.Append("data: ");

        foreach (string line in (data ?? string.Empty).Replace("\r\n", "\n").Replace('\r', '\n').Split('\n'))

            sb.Append(line).Append('\n');

        sb.Append('\n');
        byte[] bytes = Encoding.UTF8.GetBytes(sb.ToString());
        await body.WriteAsync(bytes, cancellationToken).ConfigureAwait(false);
        await body.FlushAsync(cancellationToken).ConfigureAwait(false);
    }
}
