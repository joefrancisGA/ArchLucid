using ArchLucid.Application.Governance.Coverage.Stages;
using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance.Coverage;

public sealed class CoveragePreviewService(
    ICoveragePreviewLoadStage loadStage,
    ICoveragePreviewEmitStage emitStage) : ICoveragePreviewService
{
    private readonly ICoveragePreviewLoadStage _loadStage =
        loadStage ?? throw new ArgumentNullException(nameof(loadStage));

    private readonly ICoveragePreviewEmitStage _emitStage =
        emitStage ?? throw new ArgumentNullException(nameof(emitStage));

    public async Task<CoveragePreviewResult> PreviewAsync(
        ScopeContext scope,
        CoveragePreviewInput input,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(input);

        CoveragePreviewLoadResult load = await _loadStage.LoadAsync(scope, cancellationToken);

        return _emitStage.Emit(scope, input, load);
    }
}
