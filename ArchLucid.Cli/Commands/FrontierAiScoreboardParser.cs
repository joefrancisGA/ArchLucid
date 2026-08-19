using System.Globalization;

namespace ArchLucid.Cli.Commands;

internal static class FrontierAiScoreboardParser
{
    internal static IReadOnlyList<FrontierAiScoreboardSessionRow> ParseSessions(string markdown)
    {
        if (string.IsNullOrWhiteSpace(markdown))
            return Array.Empty<FrontierAiScoreboardSessionRow>();

        List<FrontierAiScoreboardSessionRow> rows = new();
        bool inSessionLog = false;

        foreach (string rawLine in markdown.Split('\n'))
        {
            string line = rawLine.Trim();

            if (line.StartsWith("## Session log", StringComparison.Ordinal))
            {
                inSessionLog = true;

                continue;
            }

            if (inSessionLog && line.StartsWith("## ", StringComparison.Ordinal))
                break;

            if (!inSessionLog || !line.StartsWith('|'))
                continue;

            if (line.Contains("---", StringComparison.Ordinal))
                continue;

            if (line.Contains("Session | Date", StringComparison.Ordinal))
                continue;

            string[] cells = SplitTableRow(line);

            if (cells.Length < 13)
                continue;

            string sessionLabel = cells[0].Trim();

            if (string.IsNullOrWhiteSpace(sessionLabel))
                continue;

            if (sessionLabel.StartsWith('_') && sessionLabel.EndsWith('_'))
                continue;

            int decisionChangeCount = TryParseInt(cells[7]);
            int repeatUseIntent = TryParseInt(cells[9]);
            bool antiClaimsOk = !string.Equals(cells[12].Trim(), "N", StringComparison.OrdinalIgnoreCase);

            rows.Add(new FrontierAiScoreboardSessionRow
            {
                SessionLabel = sessionLabel,
                DateUtc = cells[1].Trim(),
                Packet = cells[2].Trim(),
                ExecutionMode = cells[3].Trim(),
                ArchLucidMinutes = cells[4].Trim(),
                ManualMinutes = cells[5].Trim(),
                TimingBasis = cells[6].Trim(),
                DecisionChangeCount = decisionChangeCount,
                DecisionDeltaOutcome = cells[8].Trim(),
                RepeatUseIntent = repeatUseIntent,
                LossMode = cells[10].Trim(),
                ArchLucidWin = cells[11].Trim(),
                AntiClaimsOk = antiClaimsOk,
            });
        }

        return rows;
    }

    private static string[] SplitTableRow(string line)
    {
        string trimmed = line.Trim().Trim('|');
        string[] parts = trimmed.Split('|');

        return parts.Select(static part => part.Trim()).ToArray();
    }

    private static int TryParseInt(string value)
    {
        if (int.TryParse(value.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out int parsed))
            return parsed;

        return 0;
    }
}
