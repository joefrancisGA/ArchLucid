using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline;

public sealed partial class FindingAnalysisContextBuilder
{
    private async Task VerifyPinIntegrityAsync(
        Persistence.Models.RunRecord? header,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        if (header is null)
            return;

        await _runPolicyPackPinService
            .VerifyPinIntegrityOrThrowAsync(header, scope, cancellationToken)
            .ConfigureAwait(false);

        await _runEvidencePackagePinService
            .VerifyPinIntegrityOrThrowAsync(header, scope, cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task<(IReadOnlyList<string> PackIds, IReadOnlyList<PolicyPackContentDocument> Contents)>
        ResolvePinnedPolicyPacksAsync(
            ScopeContext scope,
            Persistence.Models.RunRecord? header,
            CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(header?.PinnedPolicyPackIdsJson))
        {
            throw new ConflictException(
                "Finding analysis blocked: run is missing create-time policy pack pin JSON.");
        }

        if (!RunHeaderPinDeserializer.TryDeserializePolicyPackRows(
                header.PinnedPolicyPackIdsJson,
                out PinnedPolicyPackRow[] pinnedRows))
        {
            throw new ConflictException(
                "Finding analysis blocked: run policy pack pin JSON is not a versioned PinnedPolicyPackRow array.");
        }

        IReadOnlyList<PolicyPackContentDocument> pinnedContents =
            await LoadPackContentsForPinnedRowsAsync(scope, pinnedRows, cancellationToken).ConfigureAwait(false);

        string[] pinnedPackIds = pinnedRows
            .Select(static row => row.PolicyPackId)
            .ToArray();

        return (pinnedPackIds, pinnedContents);
    }

    private async Task<IReadOnlyList<PolicyPackContentDocument>> LoadPackContentsForPinnedRowsAsync(
        ScopeContext scope,
        IReadOnlyList<PinnedPolicyPackRow> pinnedRows,
        CancellationToken cancellationToken)
    {
        List<PolicyPackContentDocument> contents = [];

        foreach (PinnedPolicyPackRow row in pinnedRows)
        {
            if (!Guid.TryParse(row.PolicyPackId, out Guid packId))
            {
                throw new ConflictException(
                    $"Finding analysis blocked: pinned policy pack id '{row.PolicyPackId}' is not a valid GUID.");
            }

            PolicyPackVersion? version = await _policyPackVersionRepository
                .GetByPackAndVersionAsync(packId, row.PolicyPackVersion, cancellationToken)
                .ConfigureAwait(false);

            PolicyPackContentDocument? document = PolicyPackContentDocumentJson.TryDeserialize(version?.ContentJson);

            if (document is null)
            {
                throw new ConflictException(
                    $"Finding analysis blocked: pinned policy pack '{row.PolicyPackId}' version '{row.PolicyPackVersion}' could not be hydrated.");
            }

            contents.Add(document);
        }

        return contents;
    }
}
