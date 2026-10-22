using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Recomputes golden manifest hashes and compares them to the <c>ManifestGenerated</c> audit anchor (read-only).
/// </summary>
public interface IRunExportLineageVerifier
{
    /// <summary>
    ///     Returns <see langword="null" /> when the run is missing in scope; otherwise a verification report.
    /// </summary>
    Task<RunExportLineageVerificationResult?> VerifyAsync(ScopeContext scope, Guid runId, CancellationToken ct);
}
