using ArchLucid.Application.Governance;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Roi;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Roi;

/// <summary>
///     Shared fan-out and collection helpers for sponsor ROI summary builders.
/// </summary>
public sealed partial class SponsorRoiRunCollector(
    IRunDetailQueryService runDetailQueryService,
    ITenantEstimatedUsdSavingsResolver tenantEstimatedUsdSavingsResolver,
    IScopeContextProvider scopeContextProvider,
    IFindingReviewTrailRepository findingReviewTrailRepository,
    IRiskExceptionService riskExceptionService,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    ITenantCostSettingsRepository tenantCostSettingsRepository,
    IOptions<ValueReportComputationOptions> valueReportComputationOptions,
    ILogger<SponsorRoiRunCollector> logger)
{
    /// <summary>Max distinct systems whose run details are loaded per request (defense against huge tenants).</summary>
    public const int DefaultSystemDetailCap = 200;

    /// <summary>Bounded fan-out for <see cref="IRunDetailQueryService.GetRunDetailForRoiAsync"/> / savings resolution.</summary>
    private const int RunDetailRoiFanOutMaxConcurrent = 8;

    private const string UnspecifiedSystemName = "(unspecified)";

    private readonly ITenantEstimatedUsdSavingsResolver _tenantEstimatedUsdSavingsResolver =
        tenantEstimatedUsdSavingsResolver ?? throw new ArgumentNullException(nameof(tenantEstimatedUsdSavingsResolver));

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IFindingReviewTrailRepository _findingReviewTrailRepository =
        findingReviewTrailRepository ?? throw new ArgumentNullException(nameof(findingReviewTrailRepository));

    private readonly IRiskExceptionService _riskExceptionService =
        riskExceptionService ?? throw new ArgumentNullException(nameof(riskExceptionService));

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly ITenantCostSettingsRepository _tenantCostSettingsRepository =
        tenantCostSettingsRepository ?? throw new ArgumentNullException(nameof(tenantCostSettingsRepository));

    private readonly ValueReportComputationOptions _valueReportComputationOptions =
        valueReportComputationOptions?.Value ?? throw new ArgumentNullException(nameof(valueReportComputationOptions));

    private readonly ILogger<SponsorRoiRunCollector> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
}
