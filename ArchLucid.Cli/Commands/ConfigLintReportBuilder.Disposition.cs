namespace ArchLucid.Cli.Commands;

internal static partial class ConfigLintReportBuilder
{
    internal static string ResolveDisposition(int blockingCount, int advisoryCount)
    {
        if (blockingCount > 0)
            return "HOLD";

        if (advisoryCount > 0)
            return "WARN";

        return "READY";
    }
}
