namespace ArchLucid.Core.OperationalErrors;

/// <summary>Append-only platform operational error store (<c>dbo.PlatformOperationalErrors</c>).</summary>
public interface IOperationalErrorRepository
{
    Task AppendAsync(OperationalErrorRecord record, CancellationToken cancellationToken);

    Task<IReadOnlyList<OperationalErrorRecord>> SearchAsync(
        OperationalErrorSearchCriteria criteria,
        CancellationToken cancellationToken);

    Task<OperationalErrorRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<int> DeleteOlderThanAsync(DateTime cutoffUtc, int maxRows, CancellationToken cancellationToken);
}
