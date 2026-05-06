using System.Text.Json;

using ArchLucid.Cli.Support;

namespace ArchLucid.Cli.Commands;

/// <summary>HTTP probes aligned with <c>scripts/ci/cd-post-deploy-verify.sh</c> (non-destructive GETs only).</summary>
internal static class DeploymentEvidenceProbeRunner
{
    private static readonly JsonSerializerOptions PrettyJson = new() { WriteIndented = false };

    internal static async Task<DeploymentEvidenceProbeBundle> RunOnceAsync(
        HttpClient http,
        string apiBaseUrl,
        string syntheticPath,
        bool allowMissingOpenApi,
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

    private static async Task<DeploymentEvidenceProbeResult> ProbeSimpleAsync(
        HttpClient http,
        string path,
        string label,
        Func<int, bool> isPass,
        string redactedBase,
        CancellationToken cancellationToken)
    {
        try
        {
            using HttpResponseMessage response =
                await http.GetAsync(path, HttpCompletionOption.ResponseHeadersRead, cancellationToken)
                    .ConfigureAwait(false);
            int code = (int)response.StatusCode;
            string body = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            bool ok = isPass(code);
            string preview = DeploymentEvidenceBodyPreview.Format(body);

            if (ok)
                return new DeploymentEvidenceProbeResult(label, code, true, "HTTP " + code, [], preview);

            IReadOnlyList<string> triage = path == "/health/live"
                ? DeploymentEvidenceTriageCatalog.LiveFailure(redactedBase)
                : DeploymentEvidenceTriageCatalog.SyntheticFailure(path);

            return new DeploymentEvidenceProbeResult(
                label,
                code,
                false,
                "HTTP " + code + " — expected success for this gate.",
                triage,
                preview);
        }
        catch (Exception ex)
        {
            return new DeploymentEvidenceProbeResult(
                label,
                0,
                false,
                "Transport error: " + ex.GetType().Name + ": " + ex.Message,
                DeploymentEvidenceTriageCatalog.TransportFailure(label),
                DeploymentEvidenceBodyPreview.Format(ex.Message));
        }
    }

    private static async Task<DeploymentEvidenceProbeResult> ProbeReadyAsync(HttpClient http,
        CancellationToken cancellationToken)
    {
        const string label = "GET /health/ready";

        try
        {
            using HttpResponseMessage response =
                await http.GetAsync("/health/ready", HttpCompletionOption.ResponseHeadersRead, cancellationToken)
                    .ConfigureAwait(false);
            int code = (int)response.StatusCode;
            string body = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            string preview = DeploymentEvidenceBodyPreview.Format(body);

            if (code != 200)
                return new DeploymentEvidenceProbeResult(
                    label,
                    code,
                    false,
                    "HTTP " + code + " — expected 200.",
                    DeploymentEvidenceTriageCatalog.ReadyFailure(),
                    preview);

            try
            {
                using JsonDocument doc = JsonDocument.Parse(body);
                string? overall = doc.RootElement.TryGetProperty("status", out JsonElement st)
                    ? st.GetString()
                    : null;

                if (string.Equals(overall, "Healthy", StringComparison.Ordinal))
                    return new DeploymentEvidenceProbeResult(label, code, true, "HTTP 200; status=Healthy.", [], preview);

                string summary = overall is null
                    ? "JSON missing top-level .status."
                    : "Overall readiness status is `" + overall + "` (expected Healthy).";

                return new DeploymentEvidenceProbeResult(
                    label,
                    code,
                    false,
                    summary,
                    DeploymentEvidenceTriageCatalog.ReadyFailure(),
                    preview);

            }
            catch (JsonException)
            {
                return new DeploymentEvidenceProbeResult(
                    label,
                    code,
                    false,
                    "Response is not valid JSON for readiness.",
                    DeploymentEvidenceTriageCatalog.ReadyFailure(),
                    preview);
            }
        }
        catch (Exception ex)
        {
            return new DeploymentEvidenceProbeResult(
                label,
                0,
                false,
                "Transport error: " + ex.GetType().Name + ": " + ex.Message,
                DeploymentEvidenceTriageCatalog.TransportFailure(label),
                DeploymentEvidenceBodyPreview.Format(ex.Message));
        }
    }

    private static async Task<DeploymentEvidenceProbeResult> ProbeOpenApiAsync(HttpClient http,
        string redactedBase,
        bool allowMissingOpenApi,
        CancellationToken cancellationToken)
    {
        const string label = "GET /openapi/v1.json";

        try
        {
            using HttpResponseMessage response =
                await http.GetAsync("/openapi/v1.json", HttpCompletionOption.ResponseHeadersRead, cancellationToken)
                    .ConfigureAwait(false);
            int code = (int)response.StatusCode;
            string body = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            string preview = DeploymentEvidenceBodyPreview.Format(body);

            if (allowMissingOpenApi && code is 404 or 403)
            {
                return new DeploymentEvidenceProbeResult(
                    label,
                    code,
                    true,
                    "HTTP " + code + " — recorded only (--allow-missing-openapi). Not a certification gap by itself.",
                    [],
                    preview);
            }

            if (code != 200)
                return new DeploymentEvidenceProbeResult(
                    label,
                    code,
                    false,
                    "HTTP " + code + " — expected 200 (or use break-glass --allow-missing-openapi when justified).",
                    DeploymentEvidenceTriageCatalog.OpenApiFailure(redactedBase),
                    preview);

            try
            {
                using JsonDocument doc = JsonDocument.Parse(body);
                bool hasTitle =
                    doc.RootElement.TryGetProperty("info", out JsonElement info)
                    && info.TryGetProperty("title", out JsonElement title)
                    && title.ValueKind == JsonValueKind.String
                    && title.GetString()?.Length > 0;

                if (!hasTitle)
                    return new DeploymentEvidenceProbeResult(
                        label,
                        code,
                        false,
                        "OpenAPI document missing non-empty .info.title.",
                        DeploymentEvidenceTriageCatalog.OpenApiFailure(redactedBase),
                        preview);

                return new DeploymentEvidenceProbeResult(
                    label,
                    code,
                    true,
                    "HTTP 200; OpenAPI has .info.title.",
                    [],
                    preview);
            }
            catch (JsonException)
            {
                return new DeploymentEvidenceProbeResult(
                    label,
                    code,
                    false,
                    "OpenAPI body is not valid JSON.",
                    DeploymentEvidenceTriageCatalog.OpenApiFailure(redactedBase),
                    preview);
            }
        }
        catch (Exception ex)
        {
            return new DeploymentEvidenceProbeResult(
                label,
                0,
                false,
                "Transport error: " + ex.GetType().Name + ": " + ex.Message,
                DeploymentEvidenceTriageCatalog.TransportFailure(label),
                DeploymentEvidenceBodyPreview.Format(ex.Message));
        }
    }

    private static async Task<DeploymentEvidenceProbeResult> ProbeVersionAsync(HttpClient http,
        CancellationToken cancellationToken)
    {
        const string label = "GET /version";

        try
        {
            using HttpResponseMessage response =
                await http.GetAsync("/version", HttpCompletionOption.ResponseHeadersRead, cancellationToken)
                    .ConfigureAwait(false);
            int code = (int)response.StatusCode;
            string body = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            string preview;

            try
            {
                using JsonDocument doc = JsonDocument.Parse(body);
                preview = DeploymentEvidenceBodyPreview.Format(JsonSerializer.Serialize(doc.RootElement, PrettyJson));
            }
            catch (JsonException)
            {
                preview = DeploymentEvidenceBodyPreview.Format(body);
            }

            if (code != 200)
                return new DeploymentEvidenceProbeResult(
                    label,
                    code,
                    false,
                    "HTTP " + code + " — expected 200.",
                    DeploymentEvidenceTriageCatalog.VersionFailure(),
                    preview);

            return new DeploymentEvidenceProbeResult(label, code, true, "HTTP 200; version payload captured.", [], preview);
        }
        catch (Exception ex)
        {
            return new DeploymentEvidenceProbeResult(
                label,
                0,
                false,
                "Transport error: " + ex.GetType().Name + ": " + ex.Message,
                DeploymentEvidenceTriageCatalog.TransportFailure(label),
                DeploymentEvidenceBodyPreview.Format(ex.Message));
        }
    }
}
