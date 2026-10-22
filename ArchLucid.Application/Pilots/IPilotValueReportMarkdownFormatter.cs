namespace ArchLucid.Application.Pilots;

/// <summary>Markdown dashboard export for <see cref="PilotValueReport" /> using shared <c>ExportFormatterService</c> date and table layout.</summary>
public interface IPilotValueReportMarkdownFormatter
{
    string Format(PilotValueReport report);
}
