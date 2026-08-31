using ArchLucid.Application.AzureExtractor;
using ArchLucid.Application.CloudInventoryExtractor;
using ArchLucid.Application.Evidence;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Blocks execute when the run lacks an analyzable evidence basis (TB robustness #1).
/// </summary>
public static class ExecuteEvidenceReadinessEvaluator
{
    public const string ProblemDetail =
        "Execute requires analyzable architecture evidence. Upload pending files, attach inventory/IaC/diagram evidence, "
        + "or provide at least 100 characters of operator architecture context before running agents.";

    /// <summary>
    ///     Returns <see langword="false"/> when execute must be blocked for incomplete evidence.
    /// </summary>
    public static bool IsReadyForExecute(ArchitectureRequest request, EvidenceBundle? persistedBundle)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (HasPendingEvidenceWithoutUpload(request, persistedBundle))
            return false;

        if (QuickStartAnalyzableEvidenceCompleteness.HasAnalyzableEvidenceClass(request))
            return true;

        if (HasGuidedIntakeEvidence(request))
            return true;

        if (persistedBundle is not null && HasPersistedExtractorOrBulkEvidence(persistedBundle))
            return true;

        return false;
    }

    private static bool HasPendingEvidenceWithoutUpload(ArchitectureRequest request, EvidenceBundle? persistedBundle)
    {
        IReadOnlyList<string> pending =
            QuickStartAnalyzableEvidenceCompleteness.DecodePendingEvidenceFileNames(
                request.IntakeQuestionAnswers ?? new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase));

        if (pending.Count == 0)
            return false;

        if (persistedBundle is null)
            return true;

        if (HasPersistedExtractorOrBulkEvidence(persistedBundle))
            return false;

        return true;
    }

    private static bool HasGuidedIntakeEvidence(ArchitectureRequest request)
    {
        if (request.Description.Trim().Length >= QuickStartAnalyzableEvidenceCompleteness.MinOperatorBriefCharacters)
            return true;

        if (request.Documents is { Count: > 0 } documents
            && documents.Any(document => !string.IsNullOrWhiteSpace(document.Content)))
        {
            return true;
        }

        if (request.InfrastructureDeclarations is { Count: > 0 } declarations
            && declarations.Any(declaration => !string.IsNullOrWhiteSpace(declaration.Content)))
        {
            return true;
        }

        if (request.InlineRequirements is { Count: > 0 } inlineRequirements
            && inlineRequirements.Any(requirement => !string.IsNullOrWhiteSpace(requirement)))
        {
            return true;
        }

        return false;
    }

    private static bool HasPersistedExtractorOrBulkEvidence(EvidenceBundle persistedBundle)
    {
        if (AzureExtractorEvidenceBundleMerger.BundlesExtractorMetadata(persistedBundle))
            return true;

        if (CloudInventoryExtractorEvidenceBundleMerger.BundlesExtractorMetadata(persistedBundle, CloudProvider.Aws))
            return true;

        if (CloudInventoryExtractorEvidenceBundleMerger.BundlesExtractorMetadata(persistedBundle, CloudProvider.Gcp))
            return true;

        if (persistedBundle.Metadata.TryGetValue(BulkEvidenceMetadataKeys.AttachedFileCountKey, out string? rawCount)
            && int.TryParse(rawCount, out int count)
            && count > 0)
        {
            return true;
        }

        return false;
    }
}
