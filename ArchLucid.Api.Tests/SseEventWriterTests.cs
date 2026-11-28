using System.Text;

using ArchLucid.Api.Http;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SseEventWriterTests
{
    [Theory]
    [InlineData("one line", "data: one line\n\n")]
    [InlineData("first\r\nsecond\rthird\nfourth", "data: first\ndata: second\ndata: third\ndata: fourth\n\n")]
    [InlineData("first\n\nlast\n", "data: first\ndata: \ndata: last\ndata: \n\n")]
    [InlineData("", "data: \n\n")]
    public async Task WriteAsync_preserves_each_payload_line_in_one_event(string payload, string expectedData)
    {
        using MemoryStream destination = new();

        await SseEventWriter.WriteAsync(destination, "progress", payload, CancellationToken.None);

        string frame = Encoding.UTF8.GetString(destination.ToArray());
        int endOfId = frame.IndexOf('\n');
        Assert.True(endOfId > 4);
        Assert.StartsWith("id: ", frame, StringComparison.Ordinal);
        Assert.True(Guid.TryParseExact(frame[4..endOfId], "N", out _));

        // An EventSource appends only data field values, and an empty wire line ends the event.
        Assert.Equal("event: progress\n" + expectedData, frame[(endOfId + 1)..]);
    }
}
