namespace ArchLucid.ArtifactSynthesis.Services;

public static class ArtifactJsonFieldPresentation
{
    public static string FormatRequiredField(string? raw, string fieldLabel)
    {
        if (raw is null)
        {
            return $"{fieldLabel} was not stored.";
        }

        if (raw.Length == 0 || string.IsNullOrWhiteSpace(raw))
        {
            return $"{fieldLabel} was stored empty.";
        }

        return raw.Trim();
    }
}
