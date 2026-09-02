using System.Text.Json;

using ArchLucid.Application.Architecture;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Persistence.Graph;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline;

/// <summary>
///     Resolves typed prior revision snapshots and builds <see cref="FindingAnalysisContext" /> for Φ.
/// </summary>
public interface IFindingAnalysisContextBuilder
{
    Task<FindingAnalysisContext> BuildAsync(
        ScopeContext scope,
        Guid runId,
        ContextSnapshot contextSnapshot,
        ArchitectureKnowledgeModel? knowledgeModel,
        ArchitectureRequest? request,
        CancellationToken cancellationToken = default);
}

public sealed class FindingAnalysisContextBuilder(
    IRunRepository runRepository,
    IArchitectureVersionRepository architectureVersionRepository,
    IPolicyPackAssignmentRepository policyPackAssignmentRepository,
    IPolicyPackVersionRepository policyPackVersionRepository,
    IEvidencePackagePinResolver evidencePackagePinResolver) : IFindingAnalysisContextBuilder
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IArchitectureVersionRepository _architectureVersionRepository =
        architectureVersionRepository ?? throw new ArgumentNullException(nameof(architectureVersionRepository));

    private readonly IPolicyPackAssignmentRepository _policyPackAssignmentRepository =
        policyPackAssignmentRepository ?? throw new ArgumentNullException(nameof(policyPackAssignmentRepository));

    private readonly IPolicyPackVersionRepository _policyPackVersionRepository =
        policyPackVersionRepository ?? throw new ArgumentNullException(nameof(policyPackVersionRepository));

    private readonly IEvidencePackagePinResolver _evidencePackagePinResolver =
        evidencePackagePinResolver ?? throw new ArgumentNullException(nameof(evidencePackagePinResolver));

    public async Task<FindingAnalysisContext> BuildAsync(
        ScopeContext scope,
        Guid runId,
        ContextSnapshot contextSnapshot,
        ArchitectureKnowledgeModel? knowledgeModel,
        ArchitectureRequest? request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(contextSnapshot);

        Persistence.Models.RunRecord? header =
            await _runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        PriorReviewSnapshots? prior = await TryResolvePriorAsync(scope, header, request, cancellationToken)
            .ConfigureAwait(false);

        (IReadOnlyList<string> packIds, IReadOnlyList<PolicyPackContentDocument> packContents) =
            await ResolvePinnedPolicyPacksAsync(scope, header, cancellationToken).ConfigureAwait(false);

        EvidencePackagePin? evidencePin =
            await _evidencePackagePinResolver.TryResolveAzurePinAsync(scope, cancellationToken).ConfigureAwait(false);

        return new FindingAnalysisContext
        {
            RunId = runId,
            ContextSnapshotId = contextSnapshot.SnapshotId,
            ArchitectureVersionId = header?.ArchitectureVersionId,
            EnabledPolicyPackIds = packIds,
            RequiredFindingCategories = PolicyPackRequiredFindingCategoryResolver.ResolveRequiredCategories(packIds),
            RequiredEngineTypes = PolicyPackRequiredEngineTypeResolver.ResolveRequiredEngineTypes(packContents),
            Prior = prior,
            ContextCanonicalFingerprint = GraphSnapshotCanonicalFingerprint.Compute(contextSnapshot),
            KnowledgeModelFingerprint = GraphSnapshotCanonicalFingerprint.ComputeKnowledgeModelFingerprint(
                knowledgeModel),
            EvidencePin = evidencePin,
        };
    }

    private async Task<(IReadOnlyList<string> PackIds, IReadOnlyList<PolicyPackContentDocument> Contents)>
        ResolvePinnedPolicyPacksAsync(
            ScopeContext scope,
            Persistence.Models.RunRecord? header,
            CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(header?.PinnedPolicyPackIdsJson))
        {
            if (TryDeserializePinnedRows(header.PinnedPolicyPackIdsJson, out PinnedPolicyPackRow[] pinnedRows))
            {
                IReadOnlyList<PolicyPackContentDocument> pinnedContents =
                    await LoadPackContentsForPinnedRowsAsync(scope, pinnedRows, cancellationToken).ConfigureAwait(false);

                string[] pinnedPackIds = pinnedRows
                    .Select(static row => row.PolicyPackId)
                    .ToArray();

                return (pinnedPackIds, pinnedContents);
            }

            string[]? legacyPinned = JsonSerializer.Deserialize<string[]>(
                header.PinnedPolicyPackIdsJson,
                ContractJson.CamelCaseIgnoreNullCompact);

            if (legacyPinned is { Length: > 0 })
            {
                IReadOnlyList<PolicyPackContentDocument> pinnedContents =
                    await LoadPackContentsForIdsAsync(scope, legacyPinned, cancellationToken).ConfigureAwait(false);

                return (legacyPinned, pinnedContents);
            }
        }

        IReadOnlyList<PolicyPackAssignment> assignments = await _policyPackAssignmentRepository
            .ListByScopeAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, cancellationToken)
            .ConfigureAwait(false);

        PolicyPackAssignment[] enabled = assignments
            .Where(static assignment => assignment.IsEnabled)
            .ToArray();

        string[] packIds = enabled
            .Select(static assignment => assignment.PolicyPackId.ToString("D"))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        List<PolicyPackContentDocument> contents = [];

        foreach (PolicyPackAssignment assignment in enabled)
        {
            PolicyPackVersion? version = await _policyPackVersionRepository
                .GetByPackAndVersionAsync(assignment.PolicyPackId, assignment.PolicyPackVersion, cancellationToken)
                .ConfigureAwait(false);

            PolicyPackContentDocument? document = PolicyPackContentDocumentJson.TryDeserialize(version?.ContentJson);

            if (document is not null)
                contents.Add(document);
        }

        return (packIds, contents);
    }

    private static bool TryDeserializePinnedRows(string json, out PinnedPolicyPackRow[] rows)
    {
        rows = [];

        try
        {
            PinnedPolicyPackRow[]? parsed = JsonSerializer.Deserialize<PinnedPolicyPackRow[]>(
                json,
                ContractJson.CamelCaseIgnoreNullCompact);

            if (parsed is { Length: > 0 })
            {
                rows = parsed;
                return true;
            }
        }
        catch (JsonException)
        {
        }

        return false;
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
                continue;

            PolicyPackVersion? version = await _policyPackVersionRepository
                .GetByPackAndVersionAsync(packId, row.PolicyPackVersion, cancellationToken)
                .ConfigureAwait(false);

            PolicyPackContentDocument? document = PolicyPackContentDocumentJson.TryDeserialize(version?.ContentJson);

            if (document is not null)
                contents.Add(document);
        }

        return contents;
    }

    private async Task<IReadOnlyList<PolicyPackContentDocument>> LoadPackContentsForIdsAsync(
        ScopeContext scope,
        IReadOnlyList<string> packIds,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<PolicyPackAssignment> assignments = await _policyPackAssignmentRepository
            .ListByScopeAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, cancellationToken)
            .ConfigureAwait(false);

        List<PolicyPackContentDocument> contents = [];

        foreach (string packIdRaw in packIds)
        {
            if (!Guid.TryParse(packIdRaw, out Guid packId))
                continue;

            PolicyPackAssignment? assignment = assignments.FirstOrDefault(row =>
                row.IsEnabled && row.PolicyPackId == packId);

            if (assignment is null)
                continue;

            PolicyPackVersion? version = await _policyPackVersionRepository
                .GetByPackAndVersionAsync(assignment.PolicyPackId, assignment.PolicyPackVersion, cancellationToken)
                .ConfigureAwait(false);

            PolicyPackContentDocument? document = PolicyPackContentDocumentJson.TryDeserialize(version?.ContentJson);

            if (document is not null)
                contents.Add(document);
        }

        return contents;
    }

    private async Task<PriorReviewSnapshots?> TryResolvePriorAsync(
        ScopeContext scope,
        Persistence.Models.RunRecord? header,
        ArchitectureRequest? request,
        CancellationToken cancellationToken)
    {
        if (header?.ArchitectureVersionId is not Guid currentVersionId || currentVersionId == Guid.Empty)
            return null;

        ArchitectureVersionRecord? currentVersion = await _architectureVersionRepository
            .GetByIdAsync(scope, currentVersionId, cancellationToken)
            .ConfigureAwait(false);

        if (currentVersion is null)
            return null;

        Guid? requestPriorRunId = request is null
            ? null
            : ArchitectureReviewSourceRunResolver.TryResolveSourceRunId(request);

        if (requestPriorRunId is Guid parsedRequestPriorRunId && parsedRequestPriorRunId != Guid.Empty)
        {
            Persistence.Models.RunRecord? requestPriorHeader =
                await _runRepository.GetByIdAsync(scope, parsedRequestPriorRunId, cancellationToken).ConfigureAwait(false);

            if (requestPriorHeader is not null)
            {
                return new PriorReviewSnapshots
                {
                    PriorArchitectureVersionId = requestPriorHeader.ArchitectureVersionId,
                    PriorGraphSnapshotId = requestPriorHeader.GraphSnapshotId,
                    PriorFindingsSnapshotId = requestPriorHeader.FindingsSnapshotId,
                    PriorRunId = parsedRequestPriorRunId,
                };
            }
        }

        if (currentVersion.VersionNumber <= 1)
            return null;

        ArchitectureVersionRecord? predecessor = await _architectureVersionRepository
            .GetByArchitectureIdAndVersionNumberAsync(
                scope,
                currentVersion.ArchitectureId,
                currentVersion.VersionNumber - 1,
                cancellationToken)
            .ConfigureAwait(false);

        if (predecessor is null)
            return null;

        Guid? priorRunId = await _runRepository
            .GetLatestCommittedRunIdByArchitectureVersionIdAsync(scope, predecessor.ArchitectureVersionId, cancellationToken)
            .ConfigureAwait(false);

        if (priorRunId is not Guid parsedPriorRunId || parsedPriorRunId == Guid.Empty)
            return null;

        Persistence.Models.RunRecord? priorHeader =
            await _runRepository.GetByIdAsync(scope, parsedPriorRunId, cancellationToken).ConfigureAwait(false);

        if (priorHeader is null)
            return null;

        return new PriorReviewSnapshots
        {
            PriorArchitectureVersionId = priorHeader.ArchitectureVersionId,
            PriorGraphSnapshotId = priorHeader.GraphSnapshotId,
            PriorFindingsSnapshotId = priorHeader.FindingsSnapshotId,
            PriorRunId = parsedPriorRunId,
        };
    }
}
