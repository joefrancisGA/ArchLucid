namespace ArchLucid.Core.Tenancy;

/// <summary>Physically removes soft-deleted <c>dbo.Projects</c> rows past retention (SQL catalogs only).</summary>
public interface IArchitectureProjectRetentionPurgeService
{
    /// <param name="cutoffUtc">Delete rows with <c>DeletedUtc</c> strictly before this instant.</param>
    Task<IReadOnlyList<ArchitectureProjectPurgeDeletion>> PurgeExpiredAsync(DateTimeOffset cutoffUtc, CancellationToken ct);
}
