namespace ArchLucid.ArtifactSynthesis.Validation;

/// <summary>
///     Ensures top-level architecture markdown uses the mandated <c>##</c> section headers from
///     <c>architecture-outputs.mdc</c> (second-level headings only; ignores deeper headings).
/// </summary>
public static class ArchitectureMarkdownSectionValidator
{
    /// <summary>
    ///     Ordered mandated section titles (display order matches product conventions).
    /// </summary>
    public static readonly string[] RequiredSectionTitles =
    [
        "Objective",
        "Assumptions",
        "Constraints",
        "Architecture Overview",
        "Component Breakdown",
        "Data Flow",
        "Security Model",
        "Operational Considerations",
    ];

    /// <summary>
    ///     Returns section titles that do not appear as an atx <c>##</c> heading line in <paramref name="markdown" />.
    /// </summary>
    public static IReadOnlyList<string> GetMissingSectionHeaders(string markdown)
    {
        if (string.IsNullOrWhiteSpace(markdown))
            return [.. RequiredSectionTitles];

        bool[] found = new bool[RequiredSectionTitles.Length];

        foreach (string rawLine in markdown.Split(['\r', '\n'], StringSplitOptions.None))
        {
            string trimmedStart = rawLine.TrimStart();

            if (trimmedStart.Length < 3)
                continue;

            if (trimmedStart[0] != '#' || trimmedStart[1] != '#')
                continue;

            // Require exactly "##", not "###".
            if (trimmedStart.Length > 2 && trimmedStart[2] == '#')
                continue;

            int titleStart = 2;

            while (titleStart < trimmedStart.Length && trimmedStart[titleStart] == ' ')
                titleStart++;

            if (titleStart >= trimmedStart.Length)
                continue;

            string headingText = trimmedStart.Substring(titleStart).TrimEnd();

            for (int i = 0; i < RequiredSectionTitles.Length; i++)
            {
                if (headingText.Equals(RequiredSectionTitles[i], StringComparison.OrdinalIgnoreCase))
                    found[i] = true;
            }
        }

        List<string> missing = [];

        for (int i = 0; i < RequiredSectionTitles.Length; i++)
        {
            if (!found[i])
                missing.Add(RequiredSectionTitles[i]);
        }

        return missing;
    }
}
