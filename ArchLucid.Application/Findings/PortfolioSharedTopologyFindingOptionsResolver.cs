using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Findings;

public sealed class PortfolioSharedTopologyFindingOptionsResolver(
    IOptions<PortfolioSharedTopologyFindingOptions> hostOptions,
    IScopeContextProvider scopeContextProvider,
    ITenantSettingsRepository tenantSettingsRepository) : IPortfolioSharedTopologyFindingOptionsResolver
{
    private readonly IOptions<PortfolioSharedTopologyFindingOptions> _hostOptions =
        hostOptions ?? throw new ArgumentNullException(nameof(hostOptions));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantSettingsRepository _tenantSettingsRepository =
        tenantSettingsRepository ?? throw new ArgumentNullException(nameof(tenantSettingsRepository));

    public PortfolioSharedTopologyFindingOptions Resolve(CancellationToken cancellationToken = default)
    {
        PortfolioSharedTopologyFindingOptions effective = Clone(_hostOptions.Value);
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
        {
            return effective;
        }

        string? stored = _tenantSettingsRepository
            .TryGetAsync(scope.TenantId, TenantSettingKeys.FindingsPortfolioSharedTopologyEnabled, cancellationToken)
            .GetAwaiter()
            .GetResult();

        if (TenantSettingBooleanParser.TryParse(stored, out bool enabled))
        {
            effective.Enabled = enabled;
        }

        return effective;
    }

    private static PortfolioSharedTopologyFindingOptions Clone(PortfolioSharedTopologyFindingOptions source)
    {
        ArgumentNullException.ThrowIfNull(source);

        return new PortfolioSharedTopologyFindingOptions
        {
            Enabled = source.Enabled,
            MaxSystemsScanned = source.MaxSystemsScanned,
            MaxFindings = source.MaxFindings,
        };
    }
}
