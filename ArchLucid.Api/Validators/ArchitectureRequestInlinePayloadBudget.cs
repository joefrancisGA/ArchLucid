using ArchLucid.Contracts.Requests;

namespace ArchLucid.Api.Validators;

/// <summary>
///     Caps total inline requirement and document text volume on <see cref="ArchitectureRequest" /> to prevent
///     runaway memory use during ingestion.
/// </summary>
internal static class ArchitectureRequestInlinePayloadBudget
{
    public const int MaxTotalInlineCharacters = 2_000_000;

    public static bool IsWithinBudget(ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        long total = 0;

        foreach (string requirement in request.InlineRequirements)
        {
            if (requirement is null)
                continue;

            total += requirement.Length;

            if (total > MaxTotalInlineCharacters)
                return false;
        }

        foreach (ContextDocumentRequest document in request.Documents)
        {
            if (document?.Content is null)
                continue;

            total += document.Content.Length;

            if (total > MaxTotalInlineCharacters)
                return false;
        }

        return true;
    }
}
