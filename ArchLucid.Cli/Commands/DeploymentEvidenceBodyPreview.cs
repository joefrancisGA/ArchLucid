using ArchLucid.Cli.Support;

namespace ArchLucid.Cli.Commands;

/// <summary>Truncates and redacts HTTP bodies before they are written into deployment evidence Markdown.</summary>
internal static class DeploymentEvidenceBodyPreview
{
    internal const int DefaultMaxChars = 2048;

    internal static string Format(string? body, int maxChars = DefaultMaxChars)
    {
        if (string.IsNullOrEmpty(body))
            return "(empty body)";

        ArgumentOutOfRangeException.ThrowIfLessThan(maxChars, 32);

        string slice = body.Length <= maxChars ? body : body[..maxChars] + "\n... (truncated)";

        return SupportBundleRedactor.RedactSensitivePatterns(slice);
    }
}
