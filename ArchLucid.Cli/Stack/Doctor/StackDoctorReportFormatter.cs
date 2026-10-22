using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Cli.Stack.Doctor;

internal static class StackDoctorReportFormatter
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true,
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    internal static string ToJson(StackDoctorReport report) =>
        JsonSerializer.Serialize(report, JsonOptions);

    internal static string ToMarkdown(StackDoctorReport report)
    {
        StringBuilder builder = new();
        builder.AppendLine($"# Stack doctor report ({report.Profile})");
        builder.AppendLine();
        builder.AppendLine($"Generated: {report.GeneratedUtc:O}");
        builder.AppendLine($"Repository: {report.RepositoryRoot}");
        builder.AppendLine($"Overall: **{report.OverallVerdict}**");
        builder.AppendLine();
        builder.AppendLine("| Step | Verdict | Detail |");
        builder.AppendLine("| --- | --- | --- |");

        foreach (StackDoctorStepResult step in report.Steps)
        {
            string detail = step.Detail.Replace("|", "/");
            builder.AppendLine($"| {step.DisplayName} | {step.Verdict} | {detail} |");
        }

        builder.AppendLine();
        builder.AppendLine("Docs: docs/library/FIRST_AZURE_DEPLOYMENT.md · docs/runbooks/PILOT_PREREQUISITES.md");

        return builder.ToString();
    }

    internal static void WriteConsoleSummary(StackDoctorReport report)
    {
        Console.WriteLine($"archlucid stack doctor — profile {report.Profile}");
        Console.WriteLine(new string('-', 72));

        foreach (StackDoctorStepResult step in report.Steps)
        {
            Console.WriteLine($"[{step.Verdict,-7}] {step.DisplayName}");
            Console.WriteLine($"         {step.Detail}");

            if (!string.IsNullOrWhiteSpace(step.ArtifactPath))
                Console.WriteLine($"         artifact: {step.ArtifactPath}");
        }

        Console.WriteLine(new string('-', 72));
        Console.WriteLine($"Overall: {report.OverallVerdict}");
    }
}
