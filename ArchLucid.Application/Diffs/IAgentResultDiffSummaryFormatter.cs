namespace ArchLucid.Application.Diffs;

public interface IAgentResultDiffSummaryFormatter
{
    string FormatMarkdown(AgentResultDiffResult diff);
}
