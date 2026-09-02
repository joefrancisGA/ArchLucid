using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Application.Governance.PolicyPacks;

public sealed partial class PolicyPackHttpFacade
{
    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<IReadOnlyList<PolicyPack>>> ListVisiblePacksAsync(CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<IReadOnlyList<PolicyPack>>.ScopeNotFound();

        IReadOnlyList<PolicyPack> packs = await _workflow.ListVisiblePacksAsync(ct).ConfigureAwait(false);
        return PolicyPackHttpResult<IReadOnlyList<PolicyPack>>.Success(packs);
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<PolicyPacksPageBundleResponse>> GetPageBundleAsync(CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<PolicyPacksPageBundleResponse>.ScopeNotFound();

        PolicyPacksPageBundleResponse body = await _workflow.GetPageBundleAsync(ct).ConfigureAwait(false);
        return PolicyPackHttpResult<PolicyPacksPageBundleResponse>.Success(body);
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<IReadOnlyList<PolicyPackWorkspaceSelectionItem>>> ListWorkspaceSelectionAsync(
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<IReadOnlyList<PolicyPackWorkspaceSelectionItem>>.ScopeNotFound();

        IReadOnlyList<PolicyPackWorkspaceSelectionItem> rows =
            await _workflow.ListWorkspaceSelectionAsync(ct).ConfigureAwait(false);

        return PolicyPackHttpResult<IReadOnlyList<PolicyPackWorkspaceSelectionItem>>.Success(rows);
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<IReadOnlyList<PolicyPackCatalogListItem>>> ListCatalogAsync(
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<IReadOnlyList<PolicyPackCatalogListItem>>.ScopeNotFound();

        IReadOnlyList<PolicyPackCatalogListItem> rows = await _workflow.ListCatalogAsync(ct).ConfigureAwait(false);
        return PolicyPackHttpResult<IReadOnlyList<PolicyPackCatalogListItem>>.Success(rows);
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<PolicyPackCatalogEntryDetail>> GetCatalogEntryAsync(
        Guid policyPackCatalogEntryId,
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<PolicyPackCatalogEntryDetail>.ScopeNotFound();

        PolicyPackCatalogEntryDetail? row =
            await _workflow.TryGetCatalogEntryAsync(policyPackCatalogEntryId, ct).ConfigureAwait(false);

        return row is null
            ? new PolicyPackHttpResult<PolicyPackCatalogEntryDetail> { Outcome = PolicyPackHttpOutcome.ResourceNotFound }
            : PolicyPackHttpResult<PolicyPackCatalogEntryDetail>.Success(row);
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<PolicyPackCatalogEntryDetail>> PromoteCatalogEntryAsync(
        PolicyPackPromoteCatalogBody request,
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<PolicyPackCatalogEntryDetail>.ScopeNotFound();

        try
        {
            PolicyPackCatalogEntryDetail? row = await _workflow.TryPromoteCatalogEntryAsync(
                request.SourcePolicyPackId,
                request.Version,
                ct).ConfigureAwait(false);

            return row is null
                ? new PolicyPackHttpResult<PolicyPackCatalogEntryDetail> { Outcome = PolicyPackHttpOutcome.ResourceNotFound }
                : PolicyPackHttpResult<PolicyPackCatalogEntryDetail>.Success(row);
        }
        catch (PolicyPackCrossTenantDistributionBlockedException ex)
        {
            return new PolicyPackHttpResult<PolicyPackCatalogEntryDetail>
            {
                Outcome = PolicyPackHttpOutcome.CrossTenantDistributionBlocked,
                Message = ex.Message,
            };
        }
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<bool>> DemoteCatalogEntryAsync(
        PolicyPackDemoteCatalogBody request,
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<bool>.ScopeNotFound();

        bool ok = await _workflow.TryDemoteCatalogEntryAsync(request.PolicyPackCatalogEntryId, ct).ConfigureAwait(false);

        return ok
            ? PolicyPackHttpResult<bool>.Success(true)
            : new PolicyPackHttpResult<bool> { Outcome = PolicyPackHttpOutcome.ResourceNotFound };
    }
}
