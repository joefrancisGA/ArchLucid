using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance.Coverage.Stages;

public interface ICoveragePreviewLoadStage
{
    Task<CoveragePreviewLoadResult> LoadAsync(ScopeContext scope, CancellationToken cancellationToken = default);
}
