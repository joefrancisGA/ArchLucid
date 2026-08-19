using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Testable orchestration for <c>archlucid pilot init</c> — health probes, production-like config lint,
///     token diagnostic, and optional Azure OpenAI smoke.
/// </summary>
internal sealed class PilotInitOrchestrator(HttpClient http)
{
    private readonly HttpClient _http = http ?? throw new ArgumentNullException(nameof(http));

    internal async Task<PilotInitReportDocument> RunAsync(
        PilotInitOptions options,
        IConfiguration? localConfigurationOverride = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(options);

        IConfiguration localConfiguration = localConfigurationOverride
                                            ?? PilotPreflightLocalSteps.LoadLocalConfiguration(options.SimulateProduction);

        List<PilotPreflightStepResult> checks = [];

        PilotPreflightRunner runner = new(_http);
        PilotPreflightReport httpReport = await runner
            .RunAsync(options.BaseUrl, [], cancellationToken)
            .ConfigureAwait(false);

        checks.AddRange(httpReport.Steps);

        checks.AddRange(PilotPreflightProductionLikeConfigLintSteps.Evaluate(
            localConfiguration,
            options.SimulateProduction));

        checks.AddRange(PilotPreflightLocalSteps.Evaluate(localConfiguration, options.SimulateProduction));

        if (options.SkipTokenTest)
        {
            checks.Add(PilotInitAuthTokenSteps.Skipped("Skipped by --skip-token-test."));
        }
        else if (string.IsNullOrWhiteSpace(options.BearerToken))
        {
            checks.Add(PilotInitAuthTokenSteps.Skipped("No bearer token supplied — interactive prompt skipped or declined."));
        }
        else
        {
            AuthTokenClaimsDiagnosticOutcome tokenOutcome = await AuthTokenClaimsDiagnosticClient
                .DiagnoseAsync(options.BaseUrl, options.BearerToken, _http, cancellationToken)
                .ConfigureAwait(false);

            checks.Add(PilotInitAuthTokenSteps.FromOutcome(tokenOutcome));
        }

        if (options.RunOpenAiSmoke)
        {
            checks.Add(PilotPreflightOpenAiSmokeSteps.Evaluate(localConfiguration, cancellationToken: cancellationToken));
        }
        else
        {
            checks.Add(new PilotPreflightStepResult
            {
                Name = "azure-openai-smoke",
                Disposition = PilotPreflightDisposition.Pass,
                Detail = "skipped by --skip-openai-smoke or local-lab profile",
            });
        }

        return PilotInitReportBuilder.Build(options.BaseUrl, checks);
    }
}
