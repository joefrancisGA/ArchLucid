using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Application.Governance.PolicyPacks;

/// <summary>
///     HTTP-facing facade for policy pack routes: scope checks, workflow delegation, and outcome mapping for
///     <c>PolicyPacksController</c> and overlapping <c>GovernanceController.PolicyPacks</c> simulate paths.
/// </summary>
public interface IPolicyPackHttpFacade
{
    Task<PolicyPackHttpResult<PolicyPack>> CreatePackAsync(
        PolicyPackCreateBody request,
        CancellationToken ct);

    Task<PolicyPackHttpResult<PolicyPackVersion>> PublishVersionAsync(
        Guid policyPackId,
        PolicyPackPublishBody request,
        CancellationToken ct);

    Task<PolicyPackAssignHttpResult> AssignAsync(
        Guid policyPackId,
        PolicyPackAssignBody request,
        CancellationToken ct);

    Task<PolicyPackHttpResult<bool>> ArchiveAssignmentAsync(Guid assignmentId, CancellationToken ct);

    Task<PolicyPackHttpResult<bool>> SoftDeletePackAsync(Guid policyPackId, CancellationToken ct);

    Task<PolicyPackHttpResult<PolicyPack>> DuplicatePackAsync(Guid policyPackId, CancellationToken ct);

    Task<PolicyPackHttpResult<IReadOnlyList<PolicyPack>>> ListVisiblePacksAsync(CancellationToken ct);

    Task<PolicyPackHttpResult<bool>> SetAssignmentEnabledAsync(
        Guid assignmentId,
        bool isEnabled,
        CancellationToken ct);

    Task<PolicyPackHttpResult<bool>> SetAssignmentOrganizationRequiredAsync(
        Guid assignmentId,
        bool isOrganizationRequired,
        CancellationToken ct);

    Task<PolicyPackHttpResult<PolicyPacksPageBundleResponse>> GetPageBundleAsync(CancellationToken ct);

    Task<PolicyPackHttpResult<IReadOnlyList<PolicyPackWorkspaceSelectionItem>>> ListWorkspaceSelectionAsync(
        CancellationToken ct);

    Task<PolicyPackHttpResult<IReadOnlyList<PolicyPackCatalogListItem>>> ListCatalogAsync(CancellationToken ct);

    Task<PolicyPackHttpResult<PolicyPackCatalogEntryDetail>> GetCatalogEntryAsync(
        Guid policyPackCatalogEntryId,
        CancellationToken ct);

    Task<PolicyPackHttpResult<PolicyPackCatalogEntryDetail>> PromoteCatalogEntryAsync(
        PolicyPackPromoteCatalogBody request,
        CancellationToken ct);

    Task<PolicyPackHttpResult<bool>> DemoteCatalogEntryAsync(
        PolicyPackDemoteCatalogBody request,
        CancellationToken ct);

    Task<PolicyPackHttpResult<IReadOnlyList<PolicyPackVersion>>> ListVersionsAsync(
        Guid policyPackId,
        CancellationToken ct);

    Task<PolicyPackVersionHttpResult> GetVersionAsync(Guid policyPackId, string packVersion, CancellationToken ct);

    Task<PolicyPackHttpResult<string>> ExplainPackMarkdownAsync(Guid policyPackId, CancellationToken ct);

    Task<PolicyPackHttpResult<EffectivePolicyPackSet>> GetEffectiveAsync(CancellationToken ct);

    Task<PolicyPackHttpResult<PolicyPackContentDocument>> GetEffectiveContentAsync(CancellationToken ct);

    PolicyPackHttpResult<IReadOnlyList<PolicyPackRuleTemplateItem>> ListRuleTemplates();

    Task<PolicyPackHttpResult<PolicyPackGovernanceDryRunResult>> SimulateAsync(
        PolicyPackContentDocument content,
        string runId,
        bool? blockCommitOnCritical,
        int? blockCommitMinimumSeverity,
        Guid? proposedPolicyPackId,
        CancellationToken ct);

    Task<PolicyPackHttpResult<PolicyPackSimulateBulkSummary>> SimulateBulkAsync(
        Guid policyPackId,
        IReadOnlyList<string> runIds,
        bool? blockCommitOnCritical,
        int? blockCommitMinimumSeverity,
        CancellationToken ct);

    Task<PolicyPackHttpResult<PolicyPackContentValidationResponse>> ValidateContentAsync(
        JsonElement body,
        CancellationToken ct);
}
