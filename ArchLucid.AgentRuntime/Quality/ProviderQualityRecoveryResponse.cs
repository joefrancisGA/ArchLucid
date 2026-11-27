using System.Runtime.CompilerServices;

using ArchLucid.Core.Agents;

namespace ArchLucid.AgentRuntime.Quality;

/// <summary>Correlates one live hosted provider response to a trace without marking caches or serializing a lease token.</summary>
internal static class ProviderQualityRecoveryResponse
{
    private static readonly AsyncLocal<Capture?> Current = new();
    private static readonly ConditionalWeakTable<string, Lease> Responses = new();

    internal sealed record Lease(
        ProviderQualityKey Key, Guid Id, SecureNowRecoveryChallenge? SecureNowChallenge);

    internal static Capture? Begin(ProviderQualityAdmission admission, bool useSecureNowChallenge = false)
    {
        if (admission is not { RecoveryProbe: true, Key: { } key, RecoveryLeaseId: { } id })
            return null;

        Capture capture = new(Current.Value, new Lease(key, id,
            useSecureNowChallenge ? new SecureNowRecoveryChallenge() : null));
        Current.Value = capture;
        return capture;
    }

    // Called only by the concrete provider transport after a successful response, never by cache adapters.
    internal static void ConfirmTransport(string deployment, string? modelVersion, string response)
    {
        Capture? capture = Current.Value;
        if (capture is not null
            && capture.Probe.Key == ProviderQualityKey.Create("azure-openai", deployment, modelVersion))
            Volatile.Write(ref capture.LiveResponse, response);
    }

    internal static bool TryTake(string response, out Lease? lease, bool allowSecureNowChallenge = false)
    {
        if (Responses.TryGetValue(response, out Lease? candidate)
            && (candidate.SecureNowChallenge is null || allowSecureNowChallenge) && Responses.Remove(response))
        {
            lease = candidate;
            return true;
        }

        lease = null;
        return false;
    }

    internal sealed class Capture(Capture? previous, Lease probe) : IDisposable
    {
        internal Lease Probe { get; } = probe;
        internal string? LiveResponse;

        internal string Attach(string response)
        {
            if (!ReferenceEquals(Volatile.Read(ref LiveResponse), response))
                return response;

            // Only the instance returned to this caller is marked, not the one held by an inner cache.
            string isolated = new(response.AsSpan());
            Responses.Add(isolated, Probe);
            return isolated;
        }

        public void Dispose()
        {
            Current.Value = previous;
        }
    }
}
