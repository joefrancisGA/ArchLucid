using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal static class PilotInitReportBuilder
{
    private static readonly JsonSerializerOptions JsonCamel = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true,
    };

    internal const string DefaultReportFileName = "pilot-preflight-report.json";

    internal static PilotInitReportDocument Build(string baseUrl, IReadOnlyList<PilotPreflightStepResult> checks)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(baseUrl);
        ArgumentNullException.ThrowIfNull(checks);

        int blockingCount = checks.Count(static s => s.Disposition == PilotPreflightDisposition.Block);
        int warningCount = checks.Count(static s => s.Disposition == PilotPreflightDisposition.Warn);
        List<PilotInitFixStep> fixSteps = BuildFixSteps(checks);

        return new PilotInitReportDocument
        {
            GeneratedAtUtc = DateTimeOffset.UtcNow,
            BaseUrl = baseUrl.Trim().TrimEnd('/'),
            OverallDisposition = blockingCount == 0 && warningCount == 0 ? "PASS" : "HOLD",
            BlockingCount = blockingCount,
            WarningCount = warningCount,
            FixSteps = fixSteps,
            Checks = checks,
        };
    }

    internal static string ToJson(PilotInitReportDocument document) =>
        JsonSerializer.Serialize(document, JsonCamel);

    internal static async Task WriteReportAsync(PilotInitReportDocument document, string outputPath, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(outputPath);
        ArgumentNullException.ThrowIfNull(document);

        string json = ToJson(document);
        await File.WriteAllTextAsync(outputPath, json, cancellationToken).ConfigureAwait(false);
    }

    private static List<PilotInitFixStep> BuildFixSteps(IReadOnlyList<PilotPreflightStepResult> checks)
    {
        List<PilotInitFixStep> fixSteps = [];
        int stepNumber = 1;

        foreach (PilotPreflightStepResult check in checks)
        {
            if (check.Disposition == PilotPreflightDisposition.Pass)
                continue;

            string remediation = string.IsNullOrWhiteSpace(check.Remediation)
                ? "Review check detail and docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md."
                : check.Remediation!;

            fixSteps.Add(new PilotInitFixStep
            {
                StepNumber = stepNumber++,
                CheckName = check.Name,
                Detail = check.Detail,
                Remediation = remediation,
            });
        }

        return fixSteps;
    }
}
