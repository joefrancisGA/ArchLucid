namespace ArchLucid.Application.Replay.Historical.Retention;

/// <summary>Submitted by the authorized replay caller, never inferred from a backup, cache or artifact pointer.</summary>
public sealed record HistoricalRetentionGrant(HistoricalRunIdentity Run, HistoricalReplayMode Mode, Guid GrantId,
    string ActorId, DateTimeOffset EndsUtc);

public sealed record HistoricalStorageWitness(string StoreId, string Region, bool EncryptedAtRest, bool RestrictedToHistoricalReplay);

/// <summary>Fresh read and custody decision. Approved policy, authoritative lifecycle and erasure-index coverage are independent of retained bytes.</summary>
public sealed record HistoricalRetentionDecision(HistoricalArtifactIdentity Identity, Guid GrantId, string ActorId, HistoricalReplayMode Mode,
    DateTimeOffset GrantEndsUtc, bool Authorized,
    string PolicySha256, long Revision, HistoricalArtifactLifecycle Lifecycle, DateTimeOffset HardExpiresUtc,
    DateTimeOffset? HoldUntilUtc, bool ErasureIndexCoversAllCopies, bool Durable,
    HistoricalArtifactAvailability Fidelity, HistoricalStorageWitness? Primary, HistoricalStorageWitness? Archive);

/// <summary>Implementations must use the current authoritative grant, project lifecycle, placement and marker coverage, not cached or supplied artifact metadata.</summary>
public interface IHistoricalRetentionAuthority
{
    ValueTask<HistoricalRetentionDecision?> ReadCurrentAsync(HistoricalRetentionGrant grant,
        HistoricalArtifactIdentity identity, CancellationToken cancellationToken);
}

/// <summary>Read adapters configured by trusted composition. Locator schemes are not accepted from a replay request.</summary>
public sealed record HistoricalReplayStore(string StoreId, IScopedHistoricalArtifactReader Reader);
