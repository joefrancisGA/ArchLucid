using System.Net;

namespace ArchLucid.Cli.Commands;

internal sealed class ShipGateFirstValueClaimLintResult
{
    public required bool Skipped
    {
        get;
        init;
    }

    public required int ViolationCount
    {
        get;
        init;
    }

    public required string Detail
    {
        get;
        init;
    }

    public bool Success => Skipped || ViolationCount == 0;
}

internal static class ShipGateFirstValueClaimLintProbe
{
    internal const string FirstValueReportPathTemplate = "/v1/pilots/runs/{runId}/first-value-report";

    internal static async Task<ShipGateFirstValueClaimLintResult> EvaluateAsync(
        HttpClient http,
        string runId,
        bool skipClaimLint,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(http);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (skipClaimLint)
        {
            return new ShipGateFirstValueClaimLintResult
            {
                Skipped = true,
                ViolationCount = 0,
                Detail = "claimLint=skipped (--skip-claim-lint)",
            };
        }

        string path = ShipGateExportMatrixProbe.ResolvePath(FirstValueReportPathTemplate, runId);

        try
        {
            using HttpResponseMessage response = await http.GetAsync(path, cancellationToken);

            if (response.StatusCode != HttpStatusCode.OK)
            {
                return new ShipGateFirstValueClaimLintResult
                {
                    Skipped = false,
                    ViolationCount = 1,
                    Detail = $"claimLint=fail; fetch HTTP {(int)response.StatusCode} for {path}",
                };
            }

            string markdown = await response.Content.ReadAsStringAsync(cancellationToken);
            IReadOnlyList<ProofPacketClaimLintViolation> violations =
                ProofPacketClaimLinter.ScanText(markdown, "first-value-report.md");

            if (violations.Count == 0)
            {
                return new ShipGateFirstValueClaimLintResult
                {
                    Skipped = false,
                    ViolationCount = 0,
                    Detail = "claimLint=pass; violations=0",
                };
            }

            string sample = string.Join(
                "; ",
                violations
                    .Take(3)
                    .Select(static violation => $"{violation.RelativeFilePath}:{violation.LineNumber}:{violation.Phrase}"));

            return new ShipGateFirstValueClaimLintResult
            {
                Skipped = false,
                ViolationCount = violations.Count,
                Detail = $"claimLint=fail; violations={violations.Count}; sample=[{sample}]",
            };
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or IOException or InvalidOperationException)
        {
            return new ShipGateFirstValueClaimLintResult
            {
                Skipped = false,
                ViolationCount = 1,
                Detail = $"claimLint=fail; probe error: {ex.Message}",
            };
        }
    }
}
