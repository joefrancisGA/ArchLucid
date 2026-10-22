using ArchLucid.Application.Roi;
using ArchLucid.Application.Value;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Roi;
using ArchLucid.Contracts.ValueReports;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Pilots;

/// <inheritdoc cref="IPilotValueReportRoiFreshnessResolver"/>
public sealed class PilotValueReportRoiFreshnessResolver(
    IPilotRunDeltaComputer pilotRunDeltaComputer,
    ValueReportBuilder valueReportBuilder,
    RoiCostEvidenceCollectionResolver roiCostEvidenceCollectionResolver,
    IScopeContextProvider scopeContextProvider) : IPilotValueReportRoiFreshnessResolver
{
    private readonly IPilotRunDeltaComputer _pilotRunDeltaComputer =
        pilotRunDeltaComputer ?? throw new ArgumentNullException(nameof(pilotRunDeltaComputer));

    private readonly ValueReportBuilder _valueReportBuilder =
        valueReportBuilder ?? throw new ArgumentNullException(nameof(valueReportBuilder));

    private readonly RoiCostEvidenceCollectionResolver _roiCostEvidenceCollectionResolver =
        roiCostEvidenceCollectionResolver ?? throw new ArgumentNullException(nameof(roiCostEvidenceCollectionResolver));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    /// <inheritdoc/>
    public async Task<string> ResolveForRunDetailAsync(ArchitectureRunDetail? detail, CancellationToken cancellationToken)
    {
        if (detail is null)
            return "PASS";

        PilotRunDeltas deltas = await _pilotRunDeltaComputer.ComputeAsync(detail, cancellationToken).ConfigureAwait(false);
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        DateTimeOffset end = TimeProvider.System.GetUtcNow();
        DateTimeOffset start = end.AddDays(-30);
        ValueReportSnapshot snapshot = await _valueReportBuilder.BuildAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            start,
            end,
            cancellationToken).ConfigureAwait(false);

        DateTime? extractorCollectionTimestampUtc =
            await _roiCostEvidenceCollectionResolver.TryResolveLatestCollectionTimestampUtcAsync(
                scope,
                detail.Run.RunId,
                cancellationToken).ConfigureAwait(false);

        IReadOnlyList<RoiMetricSourceRow> roiSources = RoiMetricSourceCatalogBuilder.Build(snapshot);

        return RoiMetricSourceFreshnessRules.ResolveDisposition(
            extractorCollectionTimestampUtc,
            deltas.IsDemoTenant,
            deltas.EstimatedUsdSavings,
            roiSources,
            TimeProvider.System.UtcNowDateTime());
    }
}
