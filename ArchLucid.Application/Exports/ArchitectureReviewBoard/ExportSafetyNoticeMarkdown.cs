using System.Text;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>Shared demo/trial safety callouts for markdown export surfaces.</summary>
public static class ExportSafetyNoticeMarkdown
{
    public static void Append(StringBuilder sb, bool isDemoTenant, string? activeTrialExportNotice)
    {
        ArgumentNullException.ThrowIfNull(sb);

        if (isDemoTenant)
        {
            sb.AppendLine();
            sb.AppendLine($"> **Demo notice:** {ArchitectureReviewBoardCoverPageContent.DemoTenantNotice}");
        }

        if (!string.IsNullOrWhiteSpace(activeTrialExportNotice))
        {
            sb.AppendLine();
            sb.AppendLine($"> **Trial notice:** {activeTrialExportNotice.Trim()}");
        }
    }
}
