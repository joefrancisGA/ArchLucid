using System.Text;
using System.Text.Json;

using ArchLucid.Core.Hosting;

namespace ArchLucid.Cli.Commands;

internal static partial class ConfigLintReportBuilder
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = true,
    };

    internal static ConfigLintReportDocument Build(
        OperatorConfigurationLintSnapshot snapshot,
        string? profileName)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        List<ConfigLintReportFinding> blocking = snapshot.BlockingFindings
            .Select(f => ToFinding(f, "BLOCK"))
            .ToList();

        List<ConfigLintReportFinding> advisory = snapshot.AdvisoryFindings
            .Select(f => ToFinding(f, "WARN"))
            .ToList();

        if (string.Equals(profileName, ConfigLintProfileNames.ProductionLikeHostedPilot, StringComparison.Ordinal))
            PromoteHostedPilotQualityGateFindings(blocking, advisory);

        IReadOnlyList<ConfigLintReportFinding> advisoryReadOnly = advisory;

        string disposition = ResolveDisposition(blocking.Count, advisoryReadOnly.Count);

        return new ConfigLintReportDocument
        {
            ProfileName = profileName ?? string.Empty,
            HostingEnvironmentName = snapshot.HostingEnvironmentName,
            Ok = blocking.Count == 0,
            Disposition = disposition,
            SponsorHandoffRecommended = disposition is "READY" or "WARN",
            BlockingFindings = blocking,
            AdvisoryFindings = advisoryReadOnly,
            CheckCategories = BuildCheckCategories(profileName),
        };
    }

    internal static string ToJson(ConfigLintReportDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);

        return JsonSerializer.Serialize(
            new
            {
                schema = "archlucid.config-lint-report.v1",
                document.ProfileName,
                document.HostingEnvironmentName,
                document.Ok,
                proofDisposition = document.Disposition,
                document.SponsorHandoffRecommended,
                blockingFindings = document.BlockingFindings,
                advisoryFindings = document.AdvisoryFindings,
                checkCategories = document.CheckCategories,
            },
            JsonOptions);
    }

    internal static string ToMarkdown(ConfigLintReportDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);

        StringBuilder sb = new();
        sb.AppendLine("# Config lint report");
        sb.AppendLine();

        if (!string.IsNullOrWhiteSpace(document.ProfileName))
            sb.AppendLine($"**Profile:** `{document.ProfileName}`");

        sb.AppendLine($"**Hosting environment:** `{document.HostingEnvironmentName}`");
        sb.AppendLine($"**Disposition:** **{document.Disposition}**");
        sb.AppendLine($"**Sponsor handoff recommended:** **{document.SponsorHandoffRecommended}**");
        sb.AppendLine();
        sb.AppendLine(
            "_Blocking findings must be cleared before production-like hosted sponsor handoff. Advisory findings are WARN-only._");
        sb.AppendLine();

        if (document.CheckCategories.Count > 0)
        {
            sb.AppendLine("## Profile check map");
            sb.AppendLine();
            sb.AppendLine("| Category | Evaluated via |");
            sb.AppendLine("| --- | --- |");

            foreach (ConfigLintReportCheckCategory row in document.CheckCategories)
                sb.AppendLine($"| {row.Category} | {row.EvaluatedVia} |");

            sb.AppendLine();
        }

        AppendFindingSection(sb, "Blocking findings", document.BlockingFindings);
        AppendFindingSection(sb, "Advisory findings", document.AdvisoryFindings);

        return sb.ToString().TrimEnd() + Environment.NewLine;
    }
}
