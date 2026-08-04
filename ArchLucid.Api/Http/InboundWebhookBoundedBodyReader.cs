using System.Buffers;
using System.Text;

namespace ArchLucid.Api.Http;

/// <summary>
///     Reads inbound webhook bodies with Content-Length pre-check and a hard stream ceiling so
///     oversize payloads never fully allocate before HMAC/JWT verify (TB-967 / INV-015).
/// </summary>
public static class InboundWebhookBoundedBodyReader
{
    /// <summary>
    ///     Rejects when declared <c>Content-Length</c> exceeds <paramref name="maxUtf8Bytes"/> without reading,
    ///     otherwise streams until EOF or <paramref name="maxUtf8Bytes"/> + 1 (then TooLarge).
    /// </summary>
    public static async Task<InboundWebhookBoundedBodyReadResult> ReadUtf8Async(
        HttpRequest request,
        int maxUtf8Bytes,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (maxUtf8Bytes < 1)
            throw new ArgumentOutOfRangeException(nameof(maxUtf8Bytes), maxUtf8Bytes, "Max bytes must be at least 1.");

        long? contentLength = request.ContentLength;

        if (contentLength is > 0 && contentLength > maxUtf8Bytes)
        {
            int declared = contentLength.Value > int.MaxValue
                ? int.MaxValue
                : (int)contentLength.Value;

            return InboundWebhookBoundedBodyReadResult.TooLarge(declared);
        }

        request.EnableBuffering();

        if (request.Body.CanSeek)
            request.Body.Position = 0;

        byte[] rented = ArrayPool<byte>.Shared.Rent(8192);

        try
        {
            using MemoryStream buffer = new(capacity: Math.Min(maxUtf8Bytes, 8192));
            int total = 0;

            while (true)
            {
                int remainingCapacity = maxUtf8Bytes + 1 - total;
                int toRead = Math.Min(rented.Length, remainingCapacity);

                if (toRead <= 0)
                    break;

                int read = await request.Body.ReadAsync(rented.AsMemory(0, toRead), cancellationToken)
                    .ConfigureAwait(false);

                if (read == 0)
                    break;

                total += read;

                if (total > maxUtf8Bytes)
                {
                    RewindIfPossible(request);

                    return InboundWebhookBoundedBodyReadResult.TooLarge(total);
                }

                buffer.Write(rented, 0, read);
            }

            RewindIfPossible(request);

            string body = Encoding.UTF8.GetString(buffer.ToArray());

            return InboundWebhookBoundedBodyReadResult.Ok(body, total);
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(rented);
        }
    }

    private static void RewindIfPossible(HttpRequest request)
    {
        if (request.Body.CanSeek)
            request.Body.Position = 0;
    }
}
