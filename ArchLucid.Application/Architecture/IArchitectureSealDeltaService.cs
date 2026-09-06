using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Architecture;

/// <summary>Read-only seal-vs-draft delta for one architecture identity (PC-06).</summary>
public interface IArchitectureSealDeltaService
{
    /// <summary>
    ///     Returns a delta projection for <paramref name="architectureId" />, or <see langword="null" />
    ///     when the identity is missing in <paramref name="scope" />.
    /// </summary>
    Task<ArchitectureSealDeltaResponse?> GetSealDeltaAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default);
}
