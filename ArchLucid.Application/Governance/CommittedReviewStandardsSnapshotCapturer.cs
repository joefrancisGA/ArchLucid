using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Manifest;

namespace ArchLucid.Application.Governance;

/// <inheritdoc cref="ICommittedReviewStandardsSnapshotCapturer" />
public sealed class CommittedReviewStandardsSnapshotCapturer : ICommittedReviewStandardsSnapshotCapturer
{
    /// <inheritdoc />
    public void ApplyToManifest(
        ManifestDocument manifest,
        ArchitectureRequest request,
        FindingsSnapshot findings)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(findings);

        List<string> policyReferences = request.PolicyReferences
            .Where(reference => !string.IsNullOrWhiteSpace(reference))
            .Select(reference => reference.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(reference => reference, StringComparer.OrdinalIgnoreCase)
            .ToList();

        List<string> reviewedDimensions = findings.Findings
            .Where(finding => !string.IsNullOrWhiteSpace(finding.Category))
            .Select(finding => finding.Category.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(category => category, StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.ReviewStandardsAtCommit = new CommittedReviewStandardsSnapshotDescriptor
        {
            GeneratedUtc = TimeProvider.System.UtcNowDateTime(),
            PolicyReferences = policyReferences,
            FocusedPilotModeEnabled = FocusedPilotModePolicyPacks.ReferencesIncludeFocusedPilotToken(request.PolicyReferences),
            CloudProvider = request.CloudProvider.ToString(),
            ReviewedQualityDimensions = reviewedDimensions,
        };
    }
}
