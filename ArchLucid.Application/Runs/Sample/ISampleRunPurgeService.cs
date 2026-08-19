namespace ArchLucid.Application.Runs.Sample;

/// <summary>Purges <c>dbo.Runs</c> rows marked <c>IsSample = 1</c> and dependent authority artifacts (OS-1b).</summary>
public interface ISampleRunPurgeService
{
    /// <summary>Removes all sample runs for the given tenant (post real-commit hook).</summary>
    Task<SampleRunPurgeResult> PurgeForTenantAsync(Guid tenantId, CancellationToken cancellationToken);

    /// <summary>Removes sample runs with <c>CreatedUtc</c> strictly before <paramref name="createdBeforeUtc" /> (TTL worker).</summary>
    Task<SampleRunPurgeResult> PurgeExpiredAsync(DateTimeOffset createdBeforeUtc, CancellationToken cancellationToken);
}
