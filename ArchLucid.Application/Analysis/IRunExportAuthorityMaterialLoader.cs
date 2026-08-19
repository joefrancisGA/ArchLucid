using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Loads pre-serialized golden-manifest / authority-trace JSON for run export packaging.
/// </summary>
public interface IRunExportAuthorityMaterialLoader
{
    Task<RunExportAuthorityMaterialLoadResult> LoadAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken ct);
}
