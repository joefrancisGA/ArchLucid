using ArchLucid.Decisioning.Interfaces;

namespace ArchLucid.Decisioning.Findings;

/// <summary>Non-throwing helpers for <see cref="IFindingPayloadValidator" />.</summary>
public static class FindingPayloadValidatorExtensions
{
    public static bool TryValidate(
        IFindingPayloadValidator validator,
        Finding finding,
        out string errorMessage)
    {
        ArgumentNullException.ThrowIfNull(validator);
        ArgumentNullException.ThrowIfNull(finding);

        try
        {
            validator.Validate(finding);
            errorMessage = string.Empty;
            return true;
        }
        catch (InvalidOperationException ex)
        {
            errorMessage = ex.Message;
            return false;
        }
    }
}
