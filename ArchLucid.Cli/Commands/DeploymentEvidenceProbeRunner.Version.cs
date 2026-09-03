using System.Text.Json;

namespace ArchLucid.Cli.Commands;

internal static partial class DeploymentEvidenceProbeRunner
{
    private static readonly JsonSerializerOptions PrettyJson = new() { WriteIndented = false };

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
