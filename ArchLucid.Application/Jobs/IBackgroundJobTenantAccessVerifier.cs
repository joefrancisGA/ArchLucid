using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Jobs;

/// <summary>
///     Confirms a background job belongs to the caller's tenant/workspace scope before poll or download (TB-2073).
/// </summary>
public interface IBackgroundJobTenantAccessVerifier
{
    /// <summary>
    ///     Returns <see langword="true" /> when <paramref name="jobId" /> exists and its work unit is in
    ///     <paramref name="callerScope" />; otherwise <see langword="false" /> (caller should respond 404).
    /// </summary>
    Task<bool> IsAccessibleAsync(string jobId, ScopeContext callerScope, CancellationToken cancellationToken = default);
}
