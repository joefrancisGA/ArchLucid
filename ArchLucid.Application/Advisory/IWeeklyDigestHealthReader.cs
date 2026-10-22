using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Advisory;

/// <summary>Composable digest/advisory/sponsor-email habit signals for operators (read-only).</summary>
public interface IWeeklyDigestHealthReader
{
    Task<WeeklyDigestHealthSnapshot> GetSnapshotAsync(ScopeContext scope, CancellationToken cancellationToken);
}
