using ArchLucid.Application.Roi;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Analysis.ReplayComparison;

/// <inheritdoc cref="IReplayComparisonDiffSlice" />
public sealed class ReplayComparisonVerdictChromeDiffSlice(
    IAuthorityQueryService authorityQueryService,
    ITenantEstimatedUsdSavingsResolver tenantEstimatedUsdSavingsResolver,
    IScopeContextProvider scopeContextProvider) : IReplayComparisonDiffSlice
{
    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly ITenantEstimatedUsdSavingsResolver _tenantEstimatedUsdSavingsResolver =
        tenantEstimatedUsdSavingsResolver ?? throw new ArgumentNullException(nameof(tenantEstimatedUsdSavingsResolver));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public async Task ApplyAsync(ReplayComparisonBuildContext context, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        CompareVerdictChromeDelta delta = await CompareVerdictChromeDeltaBuilder
            .BuildAsync(
                context.LeftDetail,
                context.RightDetail,
                _authorityQueryService,
                _tenantEstimatedUsdSavingsResolver,
                scope,
                cancellationToken)
            .ConfigureAwait(false);

        context.Report.CompareVerdictChromeDelta = delta;
    }
}
