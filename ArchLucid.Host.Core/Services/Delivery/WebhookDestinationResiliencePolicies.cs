using System.Security.Cryptography;
using System.Text;

using ArchLucid.Core.Http;
using ArchLucid.Host.Core.Http;

using Microsoft.Extensions.Options;

using Polly;

namespace ArchLucid.Host.Core.Services.Delivery;

/// <summary>Owns bounded, process-local breaker state for each configured webhook destination.</summary>
public sealed class WebhookDestinationResiliencePolicies
{
    private const int DefaultCapacity = 4096;
    private static readonly TimeSpan SweepInterval = TimeSpan.FromSeconds(1);

    public static readonly TimeSpan CallTimeout = TimeSpan.FromSeconds(60);

    private readonly Dictionary<string, Entry> _destinations = new(StringComparer.Ordinal);
    private readonly Lock _gate = new();
    private readonly OutboundExternalHttpResilienceOptions _options;
    private readonly TimeProvider _clock;
    private readonly int _capacity;
    private readonly TimeSpan _idleRetention;
    private long? _lastSweep;

    public WebhookDestinationResiliencePolicies(IOptions<OutboundExternalHttpResilienceOptions> options)
        : this(options, TimeProvider.System, DefaultCapacity)
    {
    }

    internal WebhookDestinationResiliencePolicies(
        IOptions<OutboundExternalHttpResilienceOptions> options,
        TimeProvider clock,
        int capacity)
    {
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(clock);
        _options = options.Value;
        _clock = clock;
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(capacity);
        _capacity = capacity;
        // A recent admission may still be completing. Retain its breaker state across a full call and break.
        _idleRetention = CallTimeout + TimeSpan.FromSeconds(
            Math.Max(5, _options.SamplingDurationSeconds) + (long)Math.Max(5, _options.BreakDurationSeconds));
    }

    public IAsyncPolicy<HttpResponseMessage> ForRequest(HttpRequestMessage request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.RequestUri is not { IsAbsoluteUri: true } destination)
            throw new HttpRequestException("A webhook destination must be an absolute URI.");

        // Different endpoints on the same host need separate state. Do not retain or emit URL credentials.
        string normalized = destination.GetComponents(UriComponents.HttpRequestUrl, UriFormat.UriEscaped);
        string key = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(normalized)));

        lock (_gate)
        {
            long now = _clock.GetTimestamp();

            if (_destinations.TryGetValue(key, out Entry? existing))
            {
                existing.LastAdmission = now;

                return existing.Policy;
            }

            if (_destinations.Count >= _capacity)
                ReclaimIdleDestinations(now);

            if (_destinations.Count >= _capacity)
                throw new HttpRequestException("Webhook destination resilience capacity is temporarily exhausted.");

            IAsyncPolicy<HttpResponseMessage> policy = OutboundExternalHttpResiliencePolicy.Create(_options);
            _destinations.Add(key, new Entry(policy, now));

            return policy;
        }
    }

    private void ReclaimIdleDestinations(long now)
    {
        if (_lastSweep is { } previous && _clock.GetElapsedTime(previous, now) < SweepInterval)
            return;

        _lastSweep = now;

        foreach ((string key, Entry entry) in _destinations)
        {
            // Dictionary.Remove does not invalidate enumeration on .NET Core 3+.

            if (_clock.GetElapsedTime(entry.LastAdmission, now) >= _idleRetention)
                _destinations.Remove(key);
        }
    }

    private sealed class Entry(IAsyncPolicy<HttpResponseMessage> policy, long lastAdmission)
    {
        public IAsyncPolicy<HttpResponseMessage> Policy { get; } = policy;
        public long LastAdmission { get; set; } = lastAdmission;
    }
}
