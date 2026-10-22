using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Exports;

/// <summary>
///     Career honesty gate for export-record metadata reads (parity with byte replay and artifact export routes).
/// </summary>
public interface IRunExportCareerPostureGate
{
    Task EnsureAllowsExportRecordMetadataOrThrowAsync(
        Guid runId,
        ScopeContext scope,
        CancellationToken cancellationToken);
}
