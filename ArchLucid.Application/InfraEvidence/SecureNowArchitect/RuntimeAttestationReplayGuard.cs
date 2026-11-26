namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

// A watermark advances only after cryptographic verification. Identical observations
// are idempotent; conflicting or older observations never replace a newer baseline.
internal interface IRuntimeAttestationReplayGuard
{
    bool TryAccept(RuntimeObservationRequest scope, DateTimeOffset issuedAt,
        DateTimeOffset enumeratedAt, DateTimeOffset expiresAt, string digest, DateTimeOffset now);
}

// Process-local defense in depth only. Production multi-replica/restart protection
// requires an independently durable transactional watermark store.
internal sealed class ProcessRuntimeAttestationReplayGuard : IRuntimeAttestationReplayGuard
{
    private sealed record Watermark(DateTimeOffset IssuedAt, DateTimeOffset EnumeratedAt,
        DateTimeOffset ExpiresAt, string Digest);
    private readonly object gate = new();
    private readonly Dictionary<RuntimeObservationRequest, Watermark> watermarks = new();
    private const int Capacity = 10000;

    public bool TryAccept(RuntimeObservationRequest scope, DateTimeOffset issuedAt,
        DateTimeOffset enumeratedAt, DateTimeOffset expiresAt, string digest, DateTimeOffset now)
    {
        if (issuedAt > now || expiresAt <= now || enumeratedAt > issuedAt ||
            expiresAt <= issuedAt || string.IsNullOrWhiteSpace(digest))
            return false;
        lock (gate)
        {
            if (watermarks.TryGetValue(scope, out var previous))
            {
                if (issuedAt < previous.IssuedAt || enumeratedAt < previous.EnumeratedAt)
                    return false;
                if (issuedAt == previous.IssuedAt)
                    return enumeratedAt == previous.EnumeratedAt &&
                        expiresAt == previous.ExpiresAt && digest == previous.Digest;
            }
            else if (watermarks.Count >= Capacity)
            {
                // Never evict a baseline merely because a caller supplies a newer clock.
                // Fail closed on saturation rather than silently lose replay protection.
                return false;
            }
            watermarks[scope] = new(issuedAt, enumeratedAt, expiresAt, digest);
            return true;
        }
    }
}
