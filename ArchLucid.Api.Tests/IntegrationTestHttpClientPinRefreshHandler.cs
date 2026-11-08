using System.Net;

namespace ArchLucid.Api.Tests;

/// <summary>
///     SQL integration hosts may persist κ and knowledge-model content after execute or closed-loop admit.
///     Refresh create-time pins before finalize (and after successful execute) so commit integrity matches production.
/// </summary>
internal sealed class IntegrationTestHttpClientPinRefreshHandler : DelegatingHandler
{
    private readonly IntegrationTestWebAppFactoryBase _factory;

    public IntegrationTestHttpClientPinRefreshHandler(IntegrationTestWebAppFactoryBase factory)
    {
        _factory = factory ?? throw new ArgumentNullException(nameof(factory));
    }

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        string? runId = TryParseRunIdFromReviewLifecyclePath(request);
        bool isFinalize = runId is not null && IsFinalizePath(request);
        bool isExecute = runId is not null && IsExecutePath(request);

        if (isFinalize)
        {
            await IntegrationTestArchitectureVersionPinSupport
                .EnsureCurrentPinForRunAsync(_factory, runId!, cancellationToken)
                .ConfigureAwait(false);
        }

        HttpResponseMessage response = await base.SendAsync(request, cancellationToken).ConfigureAwait(false);

        if (isExecute
            && (response.IsSuccessStatusCode || response.StatusCode == HttpStatusCode.Conflict))
        {
            await IntegrationTestArchitectureVersionPinSupport
                .EnsureCurrentPinForRunAsync(_factory, runId!, cancellationToken)
                .ConfigureAwait(false);
        }

        return response;
    }

    private static bool IsFinalizePath(HttpRequestMessage request)
    {
        return request.Method == HttpMethod.Post
               && request.RequestUri is not null
               && request.RequestUri.AbsolutePath.EndsWith("/finalize", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsExecutePath(HttpRequestMessage request)
    {
        return request.Method == HttpMethod.Post
               && request.RequestUri is not null
               && request.RequestUri.AbsolutePath.EndsWith("/execute", StringComparison.OrdinalIgnoreCase);
    }

    private static string? TryParseRunIdFromReviewLifecyclePath(HttpRequestMessage request)
    {
        if (request.RequestUri is null)
            return null;

        string path = request.RequestUri.AbsolutePath;

        const string prefix = "/v1/architecture/review/";

        if (!path.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            return null;

        ReadOnlySpan<char> remainder = path.AsSpan(prefix.Length);

        int slash = remainder.IndexOf('/');

        if (slash <= 0)
            return null;

        string segment = remainder[..slash].ToString();

        return Guid.TryParse(segment, out _) || Guid.TryParseExact(segment, "N", out _)
            ? segment
            : null;
    }
}
