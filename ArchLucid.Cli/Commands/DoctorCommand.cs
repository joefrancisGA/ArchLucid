using System.Diagnostics.CodeAnalysis;

using ArchLucid.Cli.Diagnostics;
using ArchLucid.Core.Support;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Operator-facing readiness diagnostics: CLI build identity, local project layout,
///     optional Azure Key Vault connectivity (when <c>ArchLucid:Secrets:KeyVaultUri</c> is configured),
///     a <b>quick-start readiness</b> table (local SQL, auth mode, optional OpenAI probe, ConfigurationKeyCatalog requirements),
///     API <c>GET /version</c>, <c>/health/live</c>, <c>/health/ready</c>, anonymous <c>/health</c> (SQL deep probe),
///     and optional combined <c>/health/diagnostics</c> (requires API key or JWT with read authority).
/// </summary>
[ExcludeFromCodeCoverage(Justification =
    "CLI doctor orchestrates HTTP probes via ArchLucidApiClient (excluded from coverage); exercised manually against a running API.")]
internal static partial class DoctorCommand
{
    public static async Task<int> RunAsync(ArchLucidProjectScaffolder.ArchLucidCliConfig? config,
        CancellationToken ct = default)
    {
        Console.WriteLine("ArchLucid doctor — local checks and API readiness");
        Console.WriteLine();

        PrintCliBuildInfo();
        RunLocalProjectChecks(config);
        PrintSaaSProfileHints();

        IConfiguration doctorConfiguration = DoctorLocalConfiguration.CreateForDoctor();

        try
        {
            await DoctorKeyVaultProbe.WriteSectionAsync(Console.Out, doctorConfiguration, ct).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            Console.WriteLine();
            Console.WriteLine("Key Vault: Unexpected probe error — " + ex.GetType().Name + ": " + ex.Message);
            Console.WriteLine();
        }

        await DoctorQuickStartReadiness.WriteSectionAsync(Console.Out, doctorConfiguration, ct).ConfigureAwait(false);

        string baseUrl = ArchLucidApiClient.ResolveBaseUrl(config);
        string? urlError = ArchLucidApiClient.GetInvalidApiBaseUrlReason(baseUrl);

        if (urlError is not null)
        {
            await Console.Error.WriteLineAsync("[ArchLucid CLI] " + urlError);

            return CliExitCode.ConfigurationError;
        }

        Console.WriteLine("--- ArchLucid API ---");
        Console.WriteLine($"Base URL: {baseUrl}");

        ArchLucidApiClient client = new(baseUrl);

        await PrintApiVersionAsync(client, ct);

        bool liveOk = await PrintProbeAsync(client, "/health/live", "Liveness (/health/live)", ct);

        PrintHostingMisconfigurationHintsFromLocalEnvironment(liveOk);

        bool readyOk = await PrintProbeAsync(client, "/health/ready", "Readiness (/health/ready)", ct);

        (int aggregateCode, string aggregateBody) = await client.GetHealthProbeAsync("/health/diagnostics", ct);
        Console.WriteLine();
        Console.WriteLine($"Detailed health (/health/diagnostics) HTTP {aggregateCode}");
        Console.WriteLine(TruncateForDisplay(aggregateBody, 4000));

        if (!readyOk)
        {
            Console.WriteLine();
            Console.WriteLine("Readiness failed: fix the checks above before relying on this environment.");
            CliOperatorHints.WriteAfterReadinessFailed();

            return CliExitCode.OperationFailed;
        }

        if (aggregateCode == 401)
        {
            Console.WriteLine();
            Console.WriteLine(
                "Detailed /health/diagnostics requires authentication (ReadAuthority). Set X-Api-Key (e.g. ARCHLUCID_API_KEY) for full JSON. Liveness and readiness above are sufficient for a basic pass.");
        }
        else if (aggregateCode is < 200 or >= 300)
        {
            Console.WriteLine();
            Console.WriteLine("Combined diagnostics (/health/diagnostics) did not return 2xx; review JSON above.");
            CliOperatorHints.WriteAfterReadinessFailed();

            return CliExitCode.OperationFailed;
        }

        Console.WriteLine();
        Console.WriteLine(
            aggregateCode == 401
                ? "Doctor finished: readiness OK (detailed /health/diagnostics skipped — no credentials)."
                : "Doctor finished: readiness and detailed /health/diagnostics OK.");
        Console.WriteLine();
        Console.WriteLine(
            "Stuck mid-pilot? Symptom index: " + SupportBundleDocLinks.PilotRescuePlaybookRelativePath +
            " (from repository root, or your deployment doc mirror).");

        return CliExitCode.Success;
    }
}
