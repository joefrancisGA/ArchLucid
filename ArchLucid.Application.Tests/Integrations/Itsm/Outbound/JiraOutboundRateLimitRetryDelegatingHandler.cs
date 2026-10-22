using System.Net;

using ArchLucid.Application.Integrations.Itsm.Outbound;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

/// <summary>
///     Test-only resilience wrapper: repeats the same logical POST when Jira returns <see cref="HttpStatusCode.TooManyRequests" />,
///     honoring <c>Retry-After</c> when present. <see cref="JiraOutboundIssueClient" /> does not retry today; this handler documents
///     the expected pipeline when a future (or host-level) policy wraps the <see cref="HttpClient" />.
/// </summary>
internal sealed class JiraOutboundRateLimitRetryDelegatingHandler : DelegatingHandler
{
    private readonly int _maxAttempts;

    public JiraOutboundRateLimitRetryDelegatingHandler(HttpMessageHandler innerHandler, int maxAttempts = 4)
        : base(innerHandler)
    {
        ArgumentNullException.ThrowIfNull(innerHandler);
        _maxAttempts = Math.Max(1, maxAttempts);
    }

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        CachedRequestBody cached = await CachedRequestBody.CaptureAsync(request, cancellationToken).ConfigureAwait(false);

        HttpResponseMessage? last = null;

        for (int attempt = 1; attempt <= _maxAttempts; attempt++)
        {
            last?.Dispose();
            using HttpRequestMessage attemptRequest = cached.Rebuild();
            last = await base.SendAsync(attemptRequest, cancellationToken).ConfigureAwait(false);

            if (last.StatusCode != HttpStatusCode.TooManyRequests || attempt == _maxAttempts)
                return last;

            await WaitForRetryAfterAsync(last, cancellationToken).ConfigureAwait(false);
        }

        throw new InvalidOperationException("Retry loop exited unexpectedly.");
    }

    private static async Task WaitForRetryAfterAsync(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        if (response.Headers.TryGetValues("Retry-After", out IEnumerable<string>? values))
        {
            string? first = values.FirstOrDefault();

            if (!string.IsNullOrWhiteSpace(first) && int.TryParse(first.Trim(), out int seconds) && seconds >= 0)
            {
                // CI-friendly: Retry-After: 0 yields an immediate retry; tests may use small positive values.
                TimeSpan delay = TimeSpan.FromMilliseconds(Math.Min(seconds * 1000, 500));

                if (delay > TimeSpan.Zero)
                    await Task.Delay(delay, cancellationToken).ConfigureAwait(false);

                return;
            }
        }

        await Task.Delay(TimeSpan.FromMilliseconds(25), cancellationToken).ConfigureAwait(false);
    }

    private readonly struct CachedRequestBody
    {
        private CachedRequestBody(HttpMethod method, Uri? requestUri, byte[]? body, Dictionary<string, List<string>> requestHeaders,
            Dictionary<string, List<string>>? contentHeaders)
        {
            Method = method;
            RequestUri = requestUri;
            Body = body;
            RequestHeaders = requestHeaders;
            ContentHeaders = contentHeaders;
        }

        internal static async Task<CachedRequestBody> CaptureAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            byte[]? body = request.Content is null ? null : await request.Content.ReadAsByteArrayAsync(cancellationToken).ConfigureAwait(false);

            Dictionary<string, List<string>> requestHeaders = new(StringComparer.OrdinalIgnoreCase);

            foreach (KeyValuePair<string, IEnumerable<string>> pair in request.Headers)
                requestHeaders[pair.Key] = pair.Value.ToList();

            Dictionary<string, List<string>>? contentHeaders = null;

            if (request.Content is null)
                return new CachedRequestBody(request.Method, request.RequestUri, body, requestHeaders, contentHeaders);
            {
                contentHeaders = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);

                foreach (KeyValuePair<string, IEnumerable<string>> pair in request.Content.Headers)
                    contentHeaders[pair.Key] = pair.Value.ToList();
            }

            return new CachedRequestBody(request.Method, request.RequestUri, body, requestHeaders, contentHeaders);
        }

        private HttpMethod Method
        {
            get;
        }

        private Uri? RequestUri
        {
            get;
        }

        private byte[]? Body
        {
            get;
        }

        private Dictionary<string, List<string>> RequestHeaders
        {
            get;
        }

        private Dictionary<string, List<string>>? ContentHeaders
        {
            get;
        }

        internal HttpRequestMessage Rebuild()
        {
            HttpRequestMessage rebuilt = new(Method, RequestUri);

            foreach (KeyValuePair<string, List<string>> h in RequestHeaders)
                rebuilt.Headers.TryAddWithoutValidation(h.Key, h.Value);

            if (Body is not { Length: > 0 })
                return rebuilt;

            {
                ByteArrayContent content = new(Body);

                if (ContentHeaders is not null)

                    foreach (KeyValuePair<string, List<string>> h in ContentHeaders)
                        content.Headers.TryAddWithoutValidation(h.Key, h.Value);

                rebuilt.Content = content;
            }

            return rebuilt;
        }
    }
}
