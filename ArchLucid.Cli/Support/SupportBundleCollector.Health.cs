using System.Reflection;
using System.Runtime.InteropServices;

using ArchLucid.Cli.Commands;

namespace ArchLucid.Cli.Support;

public static partial class SupportBundleCollector
{
    private static async Task<SupportBundleApiContractSection> CollectApiContractSectionAsync(
        ArchLucidApiClient client,
        CancellationToken ct)
    {
        const string openApiPath = "/openapi/v1.json";
        const int maxCaptureBytes = 65_536;

        (int status, string preview, bool truncated) =
            await client.GetBoundedUtf8BodyAsync(openApiPath, maxCaptureBytes, ct);

        return new SupportBundleApiContractSection
        {
            MicrosoftOpenApiV1 = new SupportBundleBoundedHttpProbe
            {
                Path = openApiPath,
                HttpStatus = status,
                BodyPreview = preview,
                BodyTruncated = truncated,
                MaxBytesCaptured = maxCaptureBytes
            }
        };
    }

    private static SupportBundleCliBuildInfo ReadCliBuildInfo()
    {
        Assembly asm = typeof(SupportBundleCollector).Assembly;
        AssemblyName name = asm.GetName();

        string assemblyVersion = name.Version?.ToString() ?? "unknown";
        string informational = asm.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion
                               ?? assemblyVersion;

        return new SupportBundleCliBuildInfo
        {
            InformationalVersion = informational, AssemblyVersion = assemblyVersion, RuntimeFramework = RuntimeInformation.FrameworkDescription
        };
    }

    private static async Task<(string? Json, string? Error)> TryGetVersionAsync(
        ArchLucidApiClient client,
        CancellationToken ct)
    {
        try
        {
            string? json = await client.GetVersionJsonAsync(ct);

            if (json is null)
                return (null, "GET /version returned non-success or empty body.");

            return (json, null);
        }
        catch (Exception ex)
        {
            return (null, ex.GetType().Name + ": " + ex.Message);
        }
    }

    private static async Task<SupportBundleHealthProbe> ProbeAsync(
        ArchLucidApiClient client,
        string path,
        CancellationToken ct)
    {
        (int code, string body) = await client.GetHealthProbeAsync(path, ct);

        bool truncated = body.Length > MaxHealthBodyLength;

        if (truncated)

            body = body[..MaxHealthBodyLength] + "\n... [truncated by ArchLucid support-bundle]";

        return new SupportBundleHealthProbe { Path = path, HttpStatus = code, Body = body, BodyTruncated = truncated };
    }
}
