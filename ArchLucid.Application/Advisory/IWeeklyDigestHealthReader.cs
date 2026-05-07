using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Advisory;

/// <summary>Composable digest/advisory/executive-email habit signals for operators (read-only).</summary>
public interface IWeeklyDigestHealthReader
{
    Task<WeeklyDigestHealthSnapshot> GetSnapshotAsync(ScopeContext scope, CancellationToken cancellationToken);
}
