using ArchLucid.Cli.Support;

namespace ArchLucid.Cli.Commands;

/// <summary>HTTP probes aligned with <c>scripts/ci/cd-post-deploy-verify.sh</c> (non-destructive GETs only).</summary>
internal static partial class DeploymentEvidenceProbeRunner
{
    internal static async Task<DeploymentEvidenceProbeBundle> RunOnceAsync(
        HttpClient http,
        string apiBaseUrl,
        string syntheticPath,
        bool allowMissingOpenApi,
        string? syntheticProbeApiKey,
        string? syntheticProbeBearerToken,
        CancellationToken cancellationToken)
    {
        string redactedBase = SupportBundleRedactor.RedactHttpUrl(apiBaseUrl);
        List<DeploymentEvidenceProbeResult> probes = [];

        DeploymentEvidenceProbeResult live = await ProbeSimpleAsync(
            http,
            "/health/live",
            "GET /health/live",
            code => code == 200,
            redactedBase,
            apiKey: null,
            bearerToken: null,
            cancellationToken).ConfigureAwait(false);

        probes.Add(live);

        DeploymentEvidenceProbeResult ready = await ProbeReadyAsync(http, cancellationToken)
            .ConfigureAwait(false);

        probes.Add(ready);

        DeploymentEvidenceProbeResult openApi =
            await ProbeOpenApiAsync(http, redactedBase, allowMissingOpenApi, cancellationToken)
                .ConfigureAwait(false);

        probes.Add(openApi);

        DeploymentEvidenceProbeResult version =
            await ProbeVersionAsync(http, cancellationToken).ConfigureAwait(false);

        probes.Add(version);

        if (!string.Equals(syntheticPath, "/version", StringComparison.Ordinal))
        {
            DeploymentEvidenceProbeResult syn = await ProbeSimpleAsync(
                http,
                syntheticPath,
                "GET " + syntheticPath + " (synthetic)",
                code => code == 200,
                redactedBase,
                syntheticProbeApiKey,
                syntheticProbeBearerToken,
                cancellationToken).ConfigureAwait(false);

            probes.Add(syn);
        }
        else
        {
            probes.Add(
                new DeploymentEvidenceProbeResult(
                    "GET " + syntheticPath + " (synthetic)",
                    200,
                    version is { Passed: true, StatusCode: 200 },
                    version.Passed
                        ? "Skipped separate request — same path as /version (already probed)."
                        : "/version did not pass; synthetic path is /version by convention.",
                    version.Passed ? [] : DeploymentEvidenceTriageCatalog.SyntheticFailure(syntheticPath)));
        }

        bool allPassed = probes.All(static p => p.Passed);

        return new DeploymentEvidenceProbeBundle(probes, allPassed);
    }
}
