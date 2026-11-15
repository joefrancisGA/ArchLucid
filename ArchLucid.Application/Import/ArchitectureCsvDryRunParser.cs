namespace ArchLucid.Application.Import;

/// <summary>
///     Minimal RFC 4180-style CSV parsing for architecture import dry-runs (quoted fields with embedded commas are not supported in V1).
/// </summary>
internal static class ArchitectureCsvDryRunParser
{
    internal const string ComponentNameHeader = "ComponentName";
    internal const string TypeHeader = "Type";
    internal const string DescriptionHeader = "Description";

    internal static bool TryParseRows(string text, out List<ArchitectureCsvComponentRow> rows, out string? error)
    {
        rows = [];
        error = null;

        if (string.IsNullOrWhiteSpace(text))
        {
            error = "CSV is empty.";

            return false;
        }

        string normalized = text.TrimStart('\uFEFF')
            .Replace("\r\n", "\n", StringComparison.Ordinal)
            .Replace('\r', '\n');
        string[] lines = normalized.Split('\n', StringSplitOptions.TrimEntries);
        int headerLineIndex = Array.FindIndex(lines, line => line.Length > 0);
        int lastDataLineIndex = Array.FindLastIndex(lines, line => line.Length > 0);

        if (headerLineIndex < 0 || headerLineIndex == lastDataLineIndex)
        {
            error = "CSV must include a header row and at least one data row.";

            return false;
        }

        string[] headerCells = SplitCsvLine(lines[headerLineIndex]);

        int nameIdx = IndexOfHeader(headerCells, ComponentNameHeader);
        int typeIdx = IndexOfHeader(headerCells, TypeHeader);
        int descIdx = IndexOfHeader(headerCells, DescriptionHeader);

        if (nameIdx < 0 || typeIdx < 0 || descIdx < 0)
        {
            error =
                $"CSV must include columns {ComponentNameHeader}, {TypeHeader}, and {DescriptionHeader} (case-insensitive).";

            return false;
        }

        for (int i = headerLineIndex + 1; i <= lastDataLineIndex; i++)
        {
            string line = lines[i];

            if (string.IsNullOrWhiteSpace(line))
                continue;

            string[] cells = SplitCsvLine(line);

            string name = CellAt(cells, nameIdx);
            string type = CellAt(cells, typeIdx);
            string desc = CellAt(cells, descIdx);

            if (name.Length == 0 && type.Length == 0 && desc.Length == 0)
                continue;

            if (name.Length == 0)
            {
                error = $"Row {i + 1}: {ComponentNameHeader} is required.";

                return false;
            }

            rows.Add(new ArchitectureCsvComponentRow(name, type, desc));
            continue;

            static string CellAt(string[] row, int idx) =>
                idx < row.Length ? row[idx].Trim() : string.Empty;
        }

        if (rows.Count != 0)
            return true;

        error = "CSV contained no data rows.";

        return false;
    }

    private static int IndexOfHeader(string[] headerCells, string expected)
    {
        for (int i = 0; i < headerCells.Length; i++)
        {
            string trimmed = headerCells[i].Trim();

            if (trimmed.Equals(expected, StringComparison.OrdinalIgnoreCase))
                return i;
        }

        return -1;
    }

    /// <summary>
    ///     Splits a single CSV line on commas; does not support quotes spanning fields.
    /// </summary>
    private static string[] SplitCsvLine(string line)
    {
        return line.Split(',', StringSplitOptions.None);
    }
}
