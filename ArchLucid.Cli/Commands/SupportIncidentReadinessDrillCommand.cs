using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

using ArchLucid.Cli.Support;

namespace ArchLucid.Cli.Commands;

/// <summary>Writes support/incident readiness drill artifacts (improvement #21).</summary>
[ExcludeFromCodeCoverage(Justification = "Filesystem orchestration; catalog covered by unit tests.")]
internal static class SupportIncidentReadinessDrillCommand
{
    internal static Task<int> RunAsync(string[] args)
    {
        string? outputDirectory = null;

        for (int i = 0; i < args.Length; i++)
        {
            if (string.Equals(args[i], "--out", StringComparison.OrdinalIgnoreCase) && i + 1 < args.Length)
            {
                outputDirectory = args[i + 1];
                i++;
            }
        }

        if (string.IsNullOrWhiteSpace(outputDirectory))
        {
            Console.Error.WriteLine("Usage: archlucid support incident-readiness-drill --out <directory>");

            return Task.FromResult(CliExitCode.UsageError);
        }

        string outDir = Path.GetFullPath(outputDirectory);
        Directory.CreateDirectory(outDir);

        string triageMarkdown = SupportBundleTriageDrillCatalog.ToMarkdown();
        File.WriteAllText(Path.Combine(outDir, "support-triage-drills.md"), triageMarkdown);

        string incidentTemplate = BuildIncidentUpdateTemplate();
        File.WriteAllText(Path.Combine(outDir, "incident-customer-update-template.md"), incidentTemplate);

        var summary = new
        {
            schema = "archlucid.support.incident-readiness-drill.v1",
            generatedUtc = DateTime.UtcNow,
            disposition = "PASS",
            drillCount = SupportBundleTriageDrillCatalog.All.Count,
            artifacts =
            new[]
            {
                "support-triage-drills.md",
                "incident-customer-update-template.md",
                "drill-summary.json",
            },
            correlationIdGuidance = "Capture X-Correlation-Id from API responses and include in support tickets.",
            redactionGuidance = "Do not paste API keys, bearer tokens, or raw SAML assertions into customer-visible updates.",
        };

        File.WriteAllText(
            Path.Combine(outDir, "drill-summary.json"),
            JsonSerializer.Serialize(summary, new JsonSerializerOptions { WriteIndented = true }));

        Console.WriteLine($"Support incident readiness drill: PASS -> {outDir}");

        return Task.FromResult(CliExitCode.Success);
    }

    private static string BuildIncidentUpdateTemplate()
    {
        return """
               # Customer incident update (template)

               **Severity:** SEV-1 | SEV-2 | SEV-3 | SEV-4

               **Status:** Investigating | Identified | Monitoring | Resolved

               **Impact summary:** _(tenant scope, feature seam, workaround if any)_

               **Correlation ID(s):** _(from API response headers — no secrets)_

               **Timeline (UTC):**
               - HH:MM — Issue reported
               - HH:MM — Engineering engaged
               - HH:MM — Next update promised

               **Next update:** _(per INCIDENT_COMMUNICATIONS_POLICY.md)_

               Canonical policy: docs/go-to-market/INCIDENT_COMMUNICATIONS_POLICY.md
               """;
    }
}
