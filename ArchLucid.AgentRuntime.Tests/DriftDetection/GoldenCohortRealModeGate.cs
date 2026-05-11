namespace ArchLucid.AgentRuntime.Tests.DriftDetection;

/// <summary>
///     Environment gate for golden cohort simulator-vs-real drift tests (manual CI). Mirrors live AOAI smoke vars used by
///     <c>RealAzureOpenAIEndToEndTests</c>.
/// </summary>
public static class GoldenCohortRealModeGate
{
    /// <summary>Returns true when endpoint + API key are non-empty.</summary>
    public static bool CanRunRealModeDrift()
    {
        return !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ARCHLUCID_REAL_AOAI_TEST_ENDPOINT"))
               && !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ARCHLUCID_REAL_AOAI_TEST_KEY"));
    }

    /// <summary>Optional deployment override (defaults to <c>gpt-4o</c>).</summary>
    public static string ResolveDeploymentName()
    {
        string raw = (Environment.GetEnvironmentVariable("ARCHLUCID_REAL_AOAI_TEST_DEPLOYMENT") ?? "gpt-4o").Trim();

        return string.IsNullOrWhiteSpace(raw) ? "gpt-4o" : raw;
    }
}
