using System.Globalization;
using System.Text;

using ArchLucid.Contracts.ValueReports;

namespace ArchLucid.Application.Pilots;

/// <summary>Finding feedback (thumbs) section for the first-value report.</summary>
public static class FirstValueReportFindingFeedbackSectionFormatter
{
    public static void AppendMarkdownSection(StringBuilder sb, ValueReportSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(snapshot);

        sb.AppendLine("## Finding feedback (thumbs, tenant window)");
        sb.AppendLine();
        sb.AppendLine("| Metric | Value |");
        sb.AppendLine("| --- | ---: |");
        sb.AppendLine($"| Net score (up âˆ’ down) | {snapshot.FindingFeedbackNetScore.ToString(CultureInfo.InvariantCulture)} |");
        sb.AppendLine($"| Votes recorded | {snapshot.FindingFeedbackVoteCount.ToString(CultureInfo.InvariantCulture)} |");
        sb.AppendLine();
    }
}
