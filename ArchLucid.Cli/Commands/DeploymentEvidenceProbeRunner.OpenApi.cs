using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal static partial class DeploymentEvidenceProbeRunner
{
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
}
