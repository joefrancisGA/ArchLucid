using ArchLucid.Core.Integration;
using ArchLucid.Host.Core.Integration;
using ArchLucid.Api.Tests.Http;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Logging;

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

    [Fact]
    public async Task HandleAsync_logs_at_debug_level()
    {
        RecordingLoggerProvider sink = new();

        using ILoggerFactory factory = LoggerFactory.Create(builder =>
        {
            builder.AddProvider(sink);
            builder.SetMinimumLevel(LogLevel.Debug);
        });
        ILogger<LoggingIntegrationEventHandler> logger = factory.CreateLogger<LoggingIntegrationEventHandler>();
        LoggingIntegrationEventHandler sut = new(logger);
        ReadOnlyMemory<byte> body = "{\"event\":\"sample\"}"u8.ToArray();

        await sut.HandleAsync(body, CancellationToken.None);

        sink.Entries.Should()
            .Contain(e => e.Level == LogLevel.Debug
                          && e.Message.Contains("Integration event received", StringComparison.Ordinal));
    }
}
