using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Application.Governance.PolicyPacks;

public sealed partial class PolicyPackHttpFacade
{
    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<PolicyPack>> CreatePackAsync(
        PolicyPackCreateBody request,
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<PolicyPack>.ScopeNotFound();

        PolicyPack pack = await _workflow.CreatePackAsync(
            request.Name,
            request.Description,
            request.PackType,
            request.InitialContentJson,
            ct).ConfigureAwait(false);

        return PolicyPackHttpResult<PolicyPack>.Success(pack);
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<PolicyPackVersion>> PublishVersionAsync(
        Guid policyPackId,
        PolicyPackPublishBody request,
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<PolicyPackVersion>.ScopeNotFound();

        PolicyPackVersion? version = await _workflow.TryPublishVersionAsync(
            policyPackId,
            request.Version.Trim(),
            request.ContentJson,
            ct).ConfigureAwait(false);

        if (version is null)
        {
            return new PolicyPackHttpResult<PolicyPackVersion>
            {
                Outcome = PolicyPackHttpOutcome.ResourceNotFound,
                Message = $"Policy pack '{policyPackId}' was not found in the current scope.",
            };
        }

        return PolicyPackHttpResult<PolicyPackVersion>.Success(version);
    }

    /// <inheritdoc />
    public async Task<PolicyPackAssignHttpResult> AssignAsync(
        Guid policyPackId,
        PolicyPackAssignBody request,
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return new PolicyPackAssignHttpResult { Outcome = PolicyPackHttpOutcome.ScopeNotFound };

        string versionKey = request.Version.Trim();
        string scopeLevel = string.IsNullOrWhiteSpace(request.ScopeLevel) ? "Project" : request.ScopeLevel;

        PolicyPackAssignWorkflowResult assignResult = await _workflow.TryAssignAsync(
            policyPackId,
            versionKey,
            scopeLevel,
            request.IsPinned,
            request.IsOrganizationRequired,
            ct).ConfigureAwait(false);

        return assignResult.Outcome switch
        {
            PolicyPackAssignOutcome.Assigned => new PolicyPackAssignHttpResult
            {
                Outcome = PolicyPackHttpOutcome.Success,
                Assignment = assignResult.Assignment,
            },
            PolicyPackAssignOutcome.PackNotFound => new PolicyPackAssignHttpResult
            {
                Outcome = PolicyPackHttpOutcome.ResourceNotFound,
                PolicyPackId = policyPackId,
            },
            PolicyPackAssignOutcome.VersionNotFound => new PolicyPackAssignHttpResult
            {
                Outcome = PolicyPackHttpOutcome.VersionNotFound,
                PolicyPackId = policyPackId,
                VersionKey = versionKey,
            },
            _ => throw new InvalidOperationException($"Unexpected assign outcome: {assignResult.Outcome}."),
        };
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<bool>> ArchiveAssignmentAsync(Guid assignmentId, CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<bool>.ScopeNotFound();

        PolicyPackArchiveAssignmentOutcome outcome =
            await _workflow.TryArchiveAssignmentWithOutcomeAsync(assignmentId, ct).ConfigureAwait(false);

        return outcome switch
        {
            PolicyPackArchiveAssignmentOutcome.Archived => PolicyPackHttpResult<bool>.Success(true),
            PolicyPackArchiveAssignmentOutcome.OrganizationRequiredLock => new PolicyPackHttpResult<bool>
            {
                Outcome = PolicyPackHttpOutcome.Conflict,
                Message = "Organization-required policy pack assignments cannot be archived. Clear organization-required first.",
            },
            _ => new PolicyPackHttpResult<bool> { Outcome = PolicyPackHttpOutcome.ResourceNotFound },
        };
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<bool>> SoftDeletePackAsync(Guid policyPackId, CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<bool>.ScopeNotFound();

        bool ok = await _workflow.TrySoftDeletePackAsync(policyPackId, ct).ConfigureAwait(false);

        return ok
            ? PolicyPackHttpResult<bool>.Success(true)
            : new PolicyPackHttpResult<bool> { Outcome = PolicyPackHttpOutcome.ResourceNotFound };
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<PolicyPack>> DuplicatePackAsync(Guid policyPackId, CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<PolicyPack>.ScopeNotFound();

        PolicyPack? duplicate = await _workflow.TryDuplicatePackAsync(policyPackId, ct).ConfigureAwait(false);

        return duplicate is null
            ? new PolicyPackHttpResult<PolicyPack> { Outcome = PolicyPackHttpOutcome.ResourceNotFound }
            : PolicyPackHttpResult<PolicyPack>.Success(duplicate);
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<bool>> SetAssignmentEnabledAsync(
        Guid assignmentId,
        bool isEnabled,
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<bool>.ScopeNotFound();

        bool ok = await _workflow.TrySetAssignmentEnabledAsync(assignmentId, isEnabled, ct).ConfigureAwait(false);

        return ok
            ? PolicyPackHttpResult<bool>.Success(true)
            : new PolicyPackHttpResult<bool> { Outcome = PolicyPackHttpOutcome.ResourceNotFound };
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<bool>> SetAssignmentOrganizationRequiredAsync(
        Guid assignmentId,
        bool isOrganizationRequired,
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<bool>.ScopeNotFound();

        bool ok = await _workflow.TrySetAssignmentOrganizationRequiredAsync(assignmentId, isOrganizationRequired, ct)
            .ConfigureAwait(false);

        return ok
            ? PolicyPackHttpResult<bool>.Success(true)
            : new PolicyPackHttpResult<bool> { Outcome = PolicyPackHttpOutcome.ResourceNotFound };
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<IReadOnlyList<PolicyPackVersion>>> ListVersionsAsync(
        Guid policyPackId,
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<IReadOnlyList<PolicyPackVersion>>.ScopeNotFound();

        IReadOnlyList<PolicyPackVersion>? versions =
            await _workflow.TryListVersionsAsync(policyPackId, ct).ConfigureAwait(false);

        return versions is null
            ? new PolicyPackHttpResult<IReadOnlyList<PolicyPackVersion>> { Outcome = PolicyPackHttpOutcome.ResourceNotFound }
            : PolicyPackHttpResult<IReadOnlyList<PolicyPackVersion>>.Success(versions);
    }

    /// <inheritdoc />
    public async Task<PolicyPackVersionHttpResult> GetVersionAsync(
        Guid policyPackId,
        string packVersion,
        CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
        {
            return new PolicyPackVersionHttpResult
            {
                Outcome = PolicyPackVersionLookupOutcome.PackNotFound,
                PolicyPackId = policyPackId,
            };
        }

        PolicyPackVersionLookupResult lookup =
            await _workflow.TryGetVersionAsync(policyPackId, packVersion, ct).ConfigureAwait(false);

        return new PolicyPackVersionHttpResult
        {
            Outcome = lookup.Outcome,
            Version = lookup.Version,
            PolicyPackId = policyPackId,
            PackVersion = packVersion.Trim(),
        };
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<string>> ExplainPackMarkdownAsync(Guid policyPackId, CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<string>.ScopeNotFound();

        string? markdown = await _workflow.TryExplainPackMarkdownAsync(policyPackId, ct).ConfigureAwait(false);

        return markdown is null
            ? new PolicyPackHttpResult<string> { Outcome = PolicyPackHttpOutcome.ResourceNotFound }
            : PolicyPackHttpResult<string>.Success(markdown);
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<EffectivePolicyPackSet>> GetEffectiveAsync(CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<EffectivePolicyPackSet>.ScopeNotFound();

        EffectivePolicyPackSet effective = await _workflow.GetEffectiveAsync(ct).ConfigureAwait(false);
        return PolicyPackHttpResult<EffectivePolicyPackSet>.Success(effective);
    }

    /// <inheritdoc />
    public async Task<PolicyPackHttpResult<PolicyPackContentDocument>> GetEffectiveContentAsync(CancellationToken ct)
    {
        if (!await EnsureScopeAsync(ct).ConfigureAwait(false))
            return PolicyPackHttpResult<PolicyPackContentDocument>.ScopeNotFound();

        PolicyPackContentDocument doc = await _workflow.GetEffectiveContentAsync(ct).ConfigureAwait(false);
        return PolicyPackHttpResult<PolicyPackContentDocument>.Success(doc);
    }

    /// <inheritdoc />
    public PolicyPackHttpResult<IReadOnlyList<PolicyPackRuleTemplateItem>> ListRuleTemplates()
    {
        IReadOnlyList<PolicyPackRuleTemplateItem> templates = _workflow.ListRuleTemplates();
        return PolicyPackHttpResult<IReadOnlyList<PolicyPackRuleTemplateItem>>.Success(templates);
    }
}
