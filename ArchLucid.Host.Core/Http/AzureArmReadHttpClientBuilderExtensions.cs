using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

using Polly;
using Polly.Retry;

using LegacyArmPolicy = ArchLucid.Core.Http.AzureRmAndRetailPricesHttpRetryPolicy;

namespace ArchLucid.Host.Core.Http;

public static class AzureArmReadHttpClientBuilderExtensions
{
    public static readonly TimeSpan CallBudget = TimeSpan.FromMinutes(5);

    /// <summary>Uses the shared budget-aware timing for bodyless reads without changing other methods or ARM admission.</summary>
    public static IHttpClientBuilder AddDeadlineAwareArmReadRetries(
        this IHttpClientBuilder builder, string loggerCategory)
    {
        ArgumentNullException.ThrowIfNull(builder);
        ArgumentException.ThrowIfNullOrWhiteSpace(loggerCategory);

        return builder
            .AddLongLivedPolicyHandler(
                services => BuildDeadlineAwareReadPolicy(services, loggerCategory),
                static request => IsBodylessRead(request))
            .AddLongLivedPolicyHandler(
                services => LegacyArmPolicy.Create(
                    services.GetRequiredService<ILoggerFactory>().CreateLogger(loggerCategory)),
                static request => !IsBodylessRead(request));
    }

    private static IAsyncPolicy<HttpResponseMessage> BuildDeadlineAwareReadPolicy(
        IServiceProvider services, string loggerCategory)
    {
        TimeProvider clock = services.GetService<TimeProvider>() ?? TimeProvider.System;
        ILogger logger = services.GetRequiredService<ILoggerFactory>().CreateLogger(loggerCategory);
        DeadlineAwareReadRetryTiming timing = new(clock, CallBudget, LegacyArmPolicy.MaxRetryAttempts);

        return new ResiliencePipelineBuilder<HttpResponseMessage> { TimeProvider = clock }
            .AddStrategy(_ => timing)
            .AddRetry(timing.CreateRetryOptions(logger))
            .Build()
            .AsAsyncPolicy();
    }

    private static bool IsBodylessRead(HttpRequestMessage request) =>
        request.Content is null && (request.Method == HttpMethod.Get || request.Method == HttpMethod.Head);
}
