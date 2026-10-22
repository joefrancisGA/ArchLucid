using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance.Coverage.Stages;

public interface ICoveragePreviewEmitStage
{
    CoveragePreviewResult Emit(ScopeContext scope, CoveragePreviewInput input, CoveragePreviewLoadResult load);
}
