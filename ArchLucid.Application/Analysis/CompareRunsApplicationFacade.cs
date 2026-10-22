using ArchLucid.Application.Diffs;
using ArchLucid.Application.Runs;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Default <see cref="ICompareRunsApplicationFacade"/> consolidating comparison route orchestration previously in
///     <c>ComparisonController</c> and <c>RunComparisonController</c>.
/// </summary>
public sealed partial class CompareRunsApplicationFacade(
    IAuthorityQueryService authorityQuery,
    IRunDetailQueryService runDetailQueryService,
    IRunRepository authorityRunRepository,
    IUnifiedGoldenManifestReader unifiedGoldenManifestReader,
    IAuthorityCommitProjectionBuilder projectionBuilder,
    IComparisonService comparison,
    IAgentResultDiffService agentResultDiffService,
    IScopeContextProvider scopeProvider,
    IManifestHashService manifestHashService) : ICompareRunsApplicationFacade
{
    private readonly IAuthorityQueryService _authorityQuery =
        authorityQuery ?? throw new ArgumentNullException(nameof(authorityQuery));

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IRunRepository _authorityRunRepository =
        authorityRunRepository ?? throw new ArgumentNullException(nameof(authorityRunRepository));

    private readonly IUnifiedGoldenManifestReader _unifiedGoldenManifestReader =
        unifiedGoldenManifestReader ?? throw new ArgumentNullException(nameof(unifiedGoldenManifestReader));

    private readonly IAuthorityCommitProjectionBuilder _projectionBuilder =
        projectionBuilder ?? throw new ArgumentNullException(nameof(projectionBuilder));

    private readonly IComparisonService _comparison =
        comparison ?? throw new ArgumentNullException(nameof(comparison));

    private readonly IAgentResultDiffService _agentResultDiffService =
        agentResultDiffService ?? throw new ArgumentNullException(nameof(agentResultDiffService));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));
}
