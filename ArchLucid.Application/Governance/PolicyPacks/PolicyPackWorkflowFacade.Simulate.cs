using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Application.Governance.PolicyPacks;

public sealed partial class PolicyPackWorkflowFacade
{
    /// <inheritdoc />
    public Task<PolicyPackGovernanceDryRunResult?> SimulateAsync(
        PolicyPackContentDocument content,
        string runId,
        bool? blockCommitOnCritical,
        int? blockCommitMinimumSeverity,
        Guid? proposedPolicyPackId,
        CancellationToken ct)
    {
        string policyPackContentJson = JsonSerializer.Serialize(content, ContractJson.CamelCaseIgnoreNullCompact);

        return _policyPackGovernanceDryRunService.EvaluateAsync(
            policyPackContentJson,
            runId.Trim(),
            targetManifestId: null,
            blockCommitOnCritical,
            blockCommitMinimumSeverity,
            proposedPolicyPackId,
            ct);
    }

    /// <inheritdoc />
    public async Task<PolicyPackSimulateBulkSummary?> TrySimulateBulkAsync(
        Guid policyPackId,
        IReadOnlyList<string> runIds,
        bool? blockCommitOnCritical,
        int? blockCommitMinimumSeverity,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        PolicyPack? pack = await _packRepository.GetByIdAsync(policyPackId, ct);

        if (!IsPackVisibleInScope(pack, scope))
            return null;

        PolicyPackVersion? versionRow = await _versionRepository.GetByPackAndVersionAsync(
            policyPackId,
            pack!.CurrentVersion.Trim(),
            ct);

        if (versionRow is null)
        {
            IReadOnlyList<PolicyPackVersion> versions = await _versionRepository.ListByPackAsync(policyPackId, ct);
            PolicyPackVersion? latestMeta = versions.FirstOrDefault();

            if (latestMeta is not null)
            {
                versionRow = await _versionRepository.GetByPackAndVersionAsync(
                    policyPackId,
                    latestMeta.Version,
                    ct);
            }
        }

        if (versionRow is null || string.IsNullOrWhiteSpace(versionRow.ContentJson))
            return null;

        List<PolicyPackSimulateBulkRunOutcome> runResults = [];
        int wouldBlock = 0;
        int notFound = 0;
        int evaluated = 0;

        foreach (string runIdRaw in runIds.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(runIdRaw))
                continue;

            string runId = runIdRaw.Trim();
            PolicyPackGovernanceDryRunResult? dryRun = await _policyPackGovernanceDryRunService.EvaluateAsync(
                versionRow.ContentJson,
                runId,
                targetManifestId: null,
                blockCommitOnCritical,
                blockCommitMinimumSeverity,
                policyPackId,
                ct);

            if (dryRun is null)
            {
                notFound++;
                runResults.Add(new PolicyPackSimulateBulkRunOutcome { RunId = runId, Found = false });

                continue;
            }

            evaluated++;
            bool wouldBlockCommit = dryRun.GateResult.Blocked;

            if (wouldBlockCommit)
                wouldBlock++;

            runResults.Add(
                new PolicyPackSimulateBulkRunOutcome
                {
                    RunId = runId,
                    Found = true,
                    WouldBlockCommit = wouldBlockCommit,
                    Detail = dryRun,
                });
        }

        return new PolicyPackSimulateBulkSummary
        {
            PolicyPackId = policyPackId,
            PolicyPackVersion = versionRow.Version,
            RequestedRunCount = runIds.Count,
            EvaluatedRunCount = evaluated,
            NotFoundRunCount = notFound,
            WouldBlockCommitCount = wouldBlock,
            Results = runResults,
        };
    }

    /// <inheritdoc />
    public Task<PolicyPackContentValidationResponse> ValidateContentAsync(
        PolicyPackContentDocument document,
        CancellationToken ct) =>
        _policyPackContentAuthoringValidationService.ValidateAsync(document, ct);
}
