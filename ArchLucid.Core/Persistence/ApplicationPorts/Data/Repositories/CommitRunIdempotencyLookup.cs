namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Prior successful commit keyed by <c>Idempotency-Key</c> hash for a scoped run.</summary>
public sealed class CommitRunIdempotencyLookup
{
    public byte[] RequestFingerprint
    {
        get;
        init;
    } = [];
}
