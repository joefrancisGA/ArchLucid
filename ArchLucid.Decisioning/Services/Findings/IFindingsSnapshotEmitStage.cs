using ArchLucid.Core.Findings;

namespace ArchLucid.Decisioning.Services.Findings;

/// <summary>Findings pipeline migrator, generation status, and instrumentation/logging stage.</summary>
public interface IFindingsSnapshotEmitStage
{
    Task<FindingsSnapshot> ExecuteAsync(FindingsStageContext context, CancellationToken cancellationToken);
}
