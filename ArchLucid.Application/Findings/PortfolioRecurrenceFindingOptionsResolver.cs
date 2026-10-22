using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Findings;

public sealed class PortfolioRecurrenceFindingOptionsResolver(
    IOptions<PortfolioRecurrenceFindingOptions> hostOptions,
    IScopeContextProvider scopeContextProvider,
    ITenantSettingsRepository tenantSettingsRepository) : IPortfolioRecurrenceFindingOptionsResolver
{
    private readonly IOptions<PortfolioRecurrenceFindingOptions> _hostOptions =
        hostOptions ?? throw new ArgumentNullException(nameof(hostOptions));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantSettingsRepository _tenantSettingsRepository =
        tenantSettingsRepository ?? throw new ArgumentNullException(nameof(tenantSettingsRepository));

    public PortfolioRecurrenceFindingOptions Resolve(CancellationToken cancellationToken = default)
    {
        PortfolioRecurrenceFindingOptions effective = Clone(_hostOptions.Value);
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
        {
            return effective;
        }

        string? stored = _tenantSettingsRepository
            .TryGetAsync(scope.TenantId, TenantSettingKeys.FindingsPortfolioRecurrenceEnabled, cancellationToken)
            .GetAwaiter()
            .GetResult();

        if (TenantSettingBooleanParser.TryParse(stored, out bool enabled))
        {
            effective.Enabled = enabled;
        }

        return effective;
    }

    private static PortfolioRecurrenceFindingOptions Clone(PortfolioRecurrenceFindingOptions source)
    {
        ArgumentNullException.ThrowIfNull(source);

        return new PortfolioRecurrenceFindingOptions
        {
            Enabled = source.Enabled,
            MinSystemCountToReport = source.MinSystemCountToReport,
            MaxSystemsScanned = source.MaxSystemsScanned,
            MaxFindings = source.MaxFindings,
        };
    }
}
