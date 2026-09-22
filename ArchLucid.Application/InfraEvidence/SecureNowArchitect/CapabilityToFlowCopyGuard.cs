namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class CapabilityToFlowCopyGuard
{
    private static readonly string[] DenyList =
    [
        "exfiltrat",
        "data flowed",
        "will leak",
        "phi left the vnet",
        "patient",
    ];

    public static bool IsHonestCopy(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        foreach (string denied in DenyList)
        {
            if (text.Contains(denied, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }
        }

        return text.Contains("may", StringComparison.OrdinalIgnoreCase)
               || text.Contains("possible", StringComparison.OrdinalIgnoreCase);
    }
}
