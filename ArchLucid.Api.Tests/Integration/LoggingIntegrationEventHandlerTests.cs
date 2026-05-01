using ArchLucid.Core.Integration;
using ArchLucid.Host.Core.Integration;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Api.Tests.Integration;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class LoggingIntegrationEventHandlerTests
{
    [SkippableFact]
    public async Task HandleAsync_completes_for_utf8_payload()
    {
        LoggingIntegrationEventHandler sut = new(NullLogger<LoggingIntegrationEventHandler>.Instance);
        ReadOnlyMemory<byte> body = "{\"a\":1}"u8.ToArray();

        Func<Task> act = async () => await sut.HandleAsync(body, CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    [SkippableFact]
    public void EventType_is_wildcard()
    {
        LoggingIntegrationEventHandler sut = new(NullLogger<LoggingIntegrationEventHandler>.Instance);

        sut.EventType.Should().Be(IntegrationEventTypes.WildcardEventType);
    }
}
