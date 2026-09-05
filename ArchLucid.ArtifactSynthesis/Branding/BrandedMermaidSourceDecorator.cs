namespace ArchLucid.ArtifactSynthesis.Branding;

/// <summary>
///     Adds an optional Mermaid title comment without changing graph node or edge lines.
/// </summary>
public static class BrandedMermaidSourceDecorator
{
    private const string TitleCommentPrefix = "%% title:";

    public static string Decorate(string mermaidSource, string? companyDisplayName)
    {
        ArgumentNullException.ThrowIfNull(mermaidSource);

        if (string.IsNullOrWhiteSpace(companyDisplayName))
            return mermaidSource;

        string trimmedName = companyDisplayName.Trim();
        string titleLine = $"{TitleCommentPrefix} {trimmedName}";

        if (mermaidSource.StartsWith(TitleCommentPrefix, StringComparison.Ordinal))
            return mermaidSource;

        if (mermaidSource.Length == 0)
            return titleLine + Environment.NewLine;

        return titleLine + Environment.NewLine + mermaidSource;
    }

    /// <summary>Strips a leading title comment for tests that compare graph semantics.</summary>
    public static string StripOptionalTitleComment(string mermaidSource)
    {
        ArgumentNullException.ThrowIfNull(mermaidSource);

        if (!mermaidSource.StartsWith(TitleCommentPrefix, StringComparison.Ordinal))
            return mermaidSource;

        int newlineIndex = mermaidSource.IndexOf('\n');

        if (newlineIndex < 0)
            return string.Empty;

        return mermaidSource[(newlineIndex + 1)..];
    }
}
