using ArchLucid.Core.Http;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

using Polly;
using Polly.Retry;

using LegacyArmPolicy = ArchLucid.Core.Http.AzureRmAndRetailPricesHttpRetryPolicy;

namespace ArchLucid.Host.Core.Http;

public static class AzureArmReadHttpClientBuilderExtensions
{
    public static readonly TimeSpan CallBudget = TimeSpan.FromMinutes(5);

    /// <summary>Uses the shared budget-aware timing only for bodyless reads or explicitly verified ARM queries.</summary>
    public static IHttpClientBuilder AddDeadlineAwareArmReadRetries(
        this IHttpClientBuilder builder, string loggerCategory, bool allowVerifiedPostQueries = false)
    {
        ArgumentNullException.ThrowIfNull(builder);
        ArgumentException.ThrowIfNullOrWhiteSpace(loggerCategory);

        return builder.AddLongLivedPolicyHandler(
            services => BuildDeadlineAwareReadPolicy(services, loggerCategory),
            request => IsBodylessRead(request) || (allowVerifiedPostQueries && IsVerifiedArmPostQuery(request)));
    }

    private static IAsyncPolicy<HttpResponseMessage> BuildDeadlineAwareReadPolicy(
        IServiceProvider services, string loggerCategory)
    {
        TimeProvider clock = services.GetService<TimeProvider>() ?? TimeProvider.System;
        ILogger logger = services.GetRequiredService<ILoggerFactory>().CreateLogger(loggerCategory);
        DeadlineAwareReadRetryTiming timing = new(clock, CallBudget, LegacyArmPolicy.MaxRetryAttempts);

        return new ResiliencePipelineBuilder<HttpResponseMessage> { TimeProvider = clock }
            .AddStrategy(_ => timing)
            .AddRetry(timing.CreateRetryOptions(args => AzureRmAndRetailPricesHttpRetryPolicy.TryLogRetry(logger, args)))
            .Build()
            .AsAsyncPolicy();
    }

    private static bool IsVerifiedArmPostQuery(HttpRequestMessage request)
    {
        if (request.Method != HttpMethod.Post || request.Content is not StringContent ||
            request.RequestUri is not { IsAbsoluteUri: true } uri ||
            uri.Scheme != Uri.UriSchemeHttps || !uri.IsDefaultPort ||
            !string.Equals(uri.Host, "management.azure.com", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        string[] path = uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);

        if (path.Length < 5 || !string.Equals(path[0], "subscriptions", StringComparison.OrdinalIgnoreCase) ||
            !Guid.TryParse(path[1], out _) || !string.Equals(path[2], "providers", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        string operation = string.Join('/', path, 3, path.Length - 3);

        return string.Equals(operation, "Microsoft.CostManagement/query", StringComparison.OrdinalIgnoreCase)
               || string.Equals(operation, "Microsoft.PolicyInsights/policyStates/latest/queryResults", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsBodylessRead(HttpRequestMessage request) =>
        request.Content is null && (request.Method == HttpMethod.Get || request.Method == HttpMethod.Head);
}
