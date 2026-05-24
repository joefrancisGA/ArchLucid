using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Integration;

/// <summary>
///     Ensures <see cref="IntegrationEventsOptions" /> is coherent when options validation runs at host startup.
/// </summary>
public sealed class IntegrationEventsOptionsValidator : IValidateOptions<IntegrationEventsOptions>
{
    /// <inheritdoc />
    public ValidateOptionsResult Validate(string? name, IntegrationEventsOptions options)
    {
        if (options is null)
            throw new ArgumentNullException(nameof(options));

        List<string> failures = [];

        ValidatePublishingConfiguration(options, failures);
        ValidateConsumerConfiguration(options, failures);
        ValidateOutboxRetryBounds(options, failures);
        ValidateProcessorBounds(options, failures);
        ValidateReplayWebhookUrl(options, failures);

        if (failures.Count == 0)
            return ValidateOptionsResult.Success;

        return ValidateOptionsResult.Fail(failures);
    }

    private static void ValidatePublishingConfiguration(IntegrationEventsOptions options, List<string> failures)
    {
        string? queueOrTopic = options.QueueOrTopicName?.Trim();

        if (string.IsNullOrEmpty(queueOrTopic))
            return;

        string? connectionString = options.ServiceBusConnectionString?.Trim();
        string? fullyQualifiedNamespace = options.ServiceBusFullyQualifiedNamespace?.Trim();

        if (string.IsNullOrEmpty(connectionString) && string.IsNullOrEmpty(fullyQualifiedNamespace))
        {
            failures.Add(
                $"{IntegrationEventsOptions.SectionName}:{nameof(IntegrationEventsOptions.QueueOrTopicName)} is set "
                + $"but neither {nameof(IntegrationEventsOptions.ServiceBusConnectionString)} nor "
                + $"{nameof(IntegrationEventsOptions.ServiceBusFullyQualifiedNamespace)} is configured.");
        }
    }

    private static void ValidateConsumerConfiguration(IntegrationEventsOptions options, List<string> failures)
    {
        if (!options.ConsumerEnabled)
            return;

        if (string.IsNullOrWhiteSpace(options.QueueOrTopicName))
        {
            failures.Add(
                $"{IntegrationEventsOptions.SectionName}:{nameof(IntegrationEventsOptions.ConsumerEnabled)} requires "
                + $"{nameof(IntegrationEventsOptions.QueueOrTopicName)}.");
        }

        if (string.IsNullOrWhiteSpace(options.SubscriptionName))
        {
            failures.Add(
                $"{IntegrationEventsOptions.SectionName}:{nameof(IntegrationEventsOptions.ConsumerEnabled)} requires "
                + $"{nameof(IntegrationEventsOptions.SubscriptionName)}.");
        }
    }

    private static void ValidateOutboxRetryBounds(IntegrationEventsOptions options, List<string> failures)
    {
        if (options.OutboxMaxPublishAttempts < 1)
        {
            failures.Add(
                $"{IntegrationEventsOptions.SectionName}:{nameof(IntegrationEventsOptions.OutboxMaxPublishAttempts)} "
                + "must be at least 1.");
        }

        if (options.OutboxMaxBackoffSeconds < 1)
        {
            failures.Add(
                $"{IntegrationEventsOptions.SectionName}:{nameof(IntegrationEventsOptions.OutboxMaxBackoffSeconds)} "
                + "must be at least 1.");
        }
    }

    private static void ValidateProcessorBounds(IntegrationEventsOptions options, List<string> failures)
    {
        if (options.MaxConcurrentCalls < 1)
        {
            failures.Add(
                $"{IntegrationEventsOptions.SectionName}:{nameof(IntegrationEventsOptions.MaxConcurrentCalls)} "
                + "must be at least 1.");
        }

        if (options.PrefetchCount < 0)
        {
            failures.Add(
                $"{IntegrationEventsOptions.SectionName}:{nameof(IntegrationEventsOptions.PrefetchCount)} "
                + "must be zero or greater.");
        }
    }

    private static void ValidateReplayWebhookUrl(IntegrationEventsOptions options, List<string> failures)
    {
        string? replayUrl = options.ReplayWebhookReceiverUrl?.Trim();

        if (string.IsNullOrEmpty(replayUrl))
            return;

        if (!Uri.TryCreate(replayUrl, UriKind.Absolute, out _))
        {
            failures.Add(
                $"{IntegrationEventsOptions.SectionName}:{nameof(IntegrationEventsOptions.ReplayWebhookReceiverUrl)} "
                + "must be an absolute URI when set.");
        }
    }
}
