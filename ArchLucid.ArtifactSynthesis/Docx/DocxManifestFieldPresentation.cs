using ArchLucid.ArtifactSynthesis.Sanitization;

namespace ArchLucid.ArtifactSynthesis.Docx;

public static class DocxManifestFieldPresentation
{
    public static string FormatManifestTableCell(string? raw, string fieldLabel)
    {
        if (raw is null)
        {
            return $"{fieldLabel} was not stored.";
        }

        if (raw.Length == 0 || string.IsNullOrWhiteSpace(raw))
        {
            return $"{fieldLabel} was stored empty.";
        }

        return LlmArtifactFreeTextSanitizer.Sanitize(raw);
    }

    public static string FormatComparedOptionalValue(string? value)
    {
        if (value is null)
        {
            return "Compared value was not stored.";
        }

        if (value.Length == 0 || string.IsNullOrWhiteSpace(value))
        {
            return "Compared value was stored empty.";
        }

        return value;
    }
}
