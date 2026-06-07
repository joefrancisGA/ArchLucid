using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Builds the run export ZIP from committed authority state. Callers own diagram PNG rendering and audit events.
/// </summary>
public interface IRunExportPackageBuilder
{
    /// <summary>
    ///     Builds the export ZIP for <paramref name="runId" /> in <paramref name="scope" />.
    ///     Does not render a diagram PNG; pass <paramref name="renderedDiagramPng" /> when the caller rendered one.
    /// </summary>
    Task<RunExportPackageResult> BuildAsync(
        ScopeContext scope,
        Guid runId,
        byte[]? renderedDiagramPng,
        CancellationToken ct);
}
