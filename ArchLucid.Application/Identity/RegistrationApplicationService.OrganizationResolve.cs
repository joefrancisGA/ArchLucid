// stryker disable all
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Identity;

public sealed partial class RegistrationApplicationService
{
    private async Task<TenantRecord?> TryResolveExistingOrganizationAsync(
        string organizationName,
        CancellationToken cancellationToken)
    {
        string trimmed = organizationName.Trim();
        string normalizedOrganizationName = TenantOrganizationDuplicateDetector.NormalizeOrganizationName(trimmed);
        string slug = TenantSlugNormalizer.FromName(trimmed);
        ScopeContext unscoped = new();

        using (AmbientScopeContext.Push(unscoped))
        {
            TenantRecord? existing =
                await _tenants.GetBySlugFromControlPlaneCatalogAsync(slug, cancellationToken).ConfigureAwait(false);

            if (existing is not null)
                return existing;

            existing = await _tenants
                .GetByNormalizedOrganizationNameAsync(normalizedOrganizationName, cancellationToken)
                .ConfigureAwait(false);

            if (existing is not null)
                return existing;

            // GetBySlugAsync fans out through tenant-directory routing; last resort when catalog
            // and normalized-name probes miss (SystemWithPerTenantCatalogs + greenfield CI catalog pinning).
            return await _tenants.GetBySlugAsync(slug, cancellationToken).ConfigureAwait(false);
        }
    }
}
