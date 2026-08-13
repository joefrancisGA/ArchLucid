using Microsoft.Extensions.Logging;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Source-generated <see cref="ILogger" /> emitters for integration-event
///     <see cref="SanitizedLoggerWarningExtensions" /> helpers.
/// </summary>
/// <remarks>
///     EventIds use the 3200 series (Warning), sibling to the 3100 series (Debug) and 3000 series
///     (Information) reserved for <c>ArchLucid.Core.Diagnostics</c> sanitized log emitters.
/// </remarks>
public static partial class SanitizedLoggerWarningExtensions
{
    [LoggerMessage(
        EventId = 3201,
        Level = LogLevel.Warning,
        Message = "Failed to publish integration event type {EventType} to Service Bus.")]
    private static partial void EmitIntegrationEventServiceBusPublishFailed(
        ILogger logger,
        Exception exception,
        string eventType);

    [LoggerMessage(
        EventId = 3202,
        Level = LogLevel.Warning,
        Message = "Integration event serialization failed for {EventType}")]
    private static partial void EmitIntegrationEventSerializationFailed(
        ILogger logger,
        Exception exception,
        string eventType);

    [LoggerMessage(
        EventId = 3203,
        Level = LogLevel.Warning,
        Message = "Integration event outbox enqueue failed for {EventType}")]
    private static partial void EmitIntegrationEventOutboxEnqueueFailed(
        ILogger logger,
        Exception exception,
        string eventType);

    [LoggerMessage(
        EventId = 3204,
        Level = LogLevel.Warning,
        Message = "Integration event publish failed for {EventType}")]
    private static partial void EmitIntegrationEventBestEffortPublishFailed(
        ILogger logger,
        Exception exception,
        string eventType);

    [LoggerMessage(
        EventId = 3205,
        Level = LogLevel.Warning,
        Message = "Integration event outbox enqueue skipped for {EventType}: MessageId is required when TransactionalOutboxEnabled is true.")]
    private static partial void EmitIntegrationEventOutboxMissingMessageId(
        ILogger logger,
        string eventType);
}
