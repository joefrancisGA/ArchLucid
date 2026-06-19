using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Api.Validators;

/// <summary>
///     Determines whether an <see cref="ArchitectureRequest" /> carries enough architecture evidence
///     when <see cref="ArchitectureRequest.CloudProvider" /> is <see cref="CloudProvider.None" />.
/// </summary>
public static class ArchitectureRequestEvidenceSufficiency
{
    /// <summary>
    ///     Minimum description length for evidence-only (no cloud provider) reviews when no attachments are present.
    /// </summary>
    public const int MinDescriptionLengthForNoneOnly = 50;

    /// <summary>
    ///     Returns whether the request has enough non-cloud architecture evidence for V1 analysis.
    /// </summary>
    public static bool HasSufficientEvidenceForNoneProvider(ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.CloudProvider != CloudProvider.None)
        {
            return true;
        }

        if (HasNonEmptyDocuments(request))
        {
            return true;
        }

        if (HasNonEmptyInfrastructureDeclarations(request))
        {
            return true;
        }

        if (HasNonEmptyInlineRequirements(request))
        {
            return true;
        }

        if (HasNonEmptyHints(request))
        {
            return true;
        }

        string description = request.Description?.Trim() ?? string.Empty;

        return description.Length >= MinDescriptionLengthForNoneOnly;
    }

    private static bool HasNonEmptyDocuments(ArchitectureRequest request)
    {
        return request.Documents.Any(d =>
            !string.IsNullOrWhiteSpace(d.Name) && !string.IsNullOrWhiteSpace(d.Content));
    }

    private static bool HasNonEmptyInfrastructureDeclarations(ArchitectureRequest request)
    {
        return request.InfrastructureDeclarations.Any(d =>
            !string.IsNullOrWhiteSpace(d.Name) && !string.IsNullOrWhiteSpace(d.Content));
    }

    private static bool HasNonEmptyInlineRequirements(ArchitectureRequest request)
    {
        return request.InlineRequirements.Any(r => !string.IsNullOrWhiteSpace(r));
    }

    private static bool HasNonEmptyHints(ArchitectureRequest request)
    {
        return request.TopologyHints.Any(h => !string.IsNullOrWhiteSpace(h))
            || request.PolicyReferences.Any(h => !string.IsNullOrWhiteSpace(h))
            || request.SecurityBaselineHints.Any(h => !string.IsNullOrWhiteSpace(h));
    }
}
