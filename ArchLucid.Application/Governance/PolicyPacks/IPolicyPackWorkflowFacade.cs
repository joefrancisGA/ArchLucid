using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Application.Governance.PolicyPacks;

/// <summary>
///     Application workflow facade for policy pack HTTP routes: scope checks, repository orchestration, and audit for
///     catalog/assignment mutations.
/// </summary>
public interface IPolicyPackWorkflowFacade
{
    Task<PolicyPack> CreatePackAsync(
        string name,
        string description,
        string packType,
        string initialContentJson,
        CancellationToken ct);

    Task<PolicyPackVersion?> TryPublishVersionAsync(
        Guid policyPackId,
        string version,
        string contentJson,
        CancellationToken ct);

    Task<PolicyPackAssignWorkflowResult> TryAssignAsync(
        Guid policyPackId,
        string version,
        string scopeLevel,
        bool isPinned,
        CancellationToken ct);

    Task<bool> TryArchiveAssignmentAsync(Guid assignmentId, CancellationToken ct);

    Task<bool> TrySoftDeletePackAsync(Guid policyPackId, CancellationToken ct);

    Task<PolicyPack?> TryDuplicatePackAsync(Guid policyPackId, CancellationToken ct);

    Task<IReadOnlyList<PolicyPack>> ListVisiblePacksAsync(CancellationToken ct);

    Task<PolicyPacksPageBundleResponse> GetPageBundleAsync(CancellationToken ct);

    Task<IReadOnlyList<PolicyPackWorkspaceSelectionItem>> ListWorkspaceSelectionAsync(CancellationToken ct);

    Task<bool> TrySetAssignmentEnabledAsync(Guid assignmentId, bool isEnabled, CancellationToken ct);

    Task<IReadOnlyList<PolicyPackCatalogListItem>> ListCatalogAsync(CancellationToken ct);

    Task<PolicyPackCatalogEntryDetail?> TryGetCatalogEntryAsync(Guid policyPackCatalogEntryId, CancellationToken ct);

    Task<PolicyPackCatalogEntryDetail?> TryPromoteCatalogEntryAsync(
        Guid sourcePolicyPackId,
        string? version,
        CancellationToken ct);

    Task<bool> TryDemoteCatalogEntryAsync(Guid policyPackCatalogEntryId, CancellationToken ct);

    Task<IReadOnlyList<PolicyPackVersion>?> TryListVersionsAsync(Guid policyPackId, CancellationToken ct);

    Task<PolicyPackVersionLookupResult> TryGetVersionAsync(Guid policyPackId, string packVersion, CancellationToken ct);

    Task<string?> TryExplainPackMarkdownAsync(Guid policyPackId, CancellationToken ct);

    Task<EffectivePolicyPackSet> GetEffectiveAsync(CancellationToken ct);

    Task<PolicyPackContentDocument> GetEffectiveContentAsync(CancellationToken ct);

    IReadOnlyList<PolicyPackRuleTemplateItem> ListRuleTemplates();

    Task<PolicyPackGovernanceDryRunResult?> SimulateAsync(
        PolicyPackContentDocument content,
        string runId,
        bool? blockCommitOnCritical,
        int? blockCommitMinimumSeverity,
        Guid? proposedPolicyPackId,
        CancellationToken ct);

    Task<PolicyPackSimulateBulkSummary?> TrySimulateBulkAsync(
        Guid policyPackId,
        IReadOnlyList<string> runIds,
        bool? blockCommitOnCritical,
        int? blockCommitMinimumSeverity,
        CancellationToken ct);

    Task<PolicyPackContentValidationResponse> ValidateContentAsync(
        PolicyPackContentDocument document,
        CancellationToken ct);
}
