using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal static partial class DeploymentEvidenceProbeRunner
{
    private static async Task<DeploymentEvidenceProbeResult> ProbeSimpleAsync(
        HttpClient http,
        string path,
        string label,
        Func<int, bool> isPass,
        string redactedBase,
        string? apiKey,
        string? bearerToken,
        CancellationToken cancellationToken)
    {
        try
        {
            using HttpRequestMessage request = new(HttpMethod.Get, path);

            if (!string.IsNullOrWhiteSpace(bearerToken))
                request.Headers.TryAddWithoutValidation("Authorization", "Bearer " + bearerToken.Trim());
            else if (!string.IsNullOrWhiteSpace(apiKey))
                request.Headers.TryAddWithoutValidation("X-Api-Key", apiKey.Trim());

            using HttpResponseMessage response =
                await http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken)
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
}
