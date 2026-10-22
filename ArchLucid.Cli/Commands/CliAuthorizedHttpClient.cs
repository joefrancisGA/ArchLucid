using System.Net.Http.Headers;

namespace ArchLucid.Cli.Commands;

internal static class CliAuthorizedHttpClient
{
    internal static HttpClient Create(string baseUrl, ArchLucidProjectScaffolder.ArchLucidCliConfig? config = null)
    {
        ArchLucidProjectScaffolder.ArchLucidCliConfig? effectiveConfig =
            config ?? CliCommandShared.TryLoadConfigFromCwd();
        using CliHttpProbeSession session = CliHttpProbeSession.ForApi(baseUrl, effectiveConfig);
        HttpClient http = session.DetachClient();
        session.SetAcceptJson();
        CliScopeHeaders.Apply(http, effectiveConfig);

        return http;
    }

    internal static string ResolveBaseUrl(string[] args, ArchLucidProjectScaffolder.ArchLucidCliConfig? config)
    {
        string? apiOverride = CliCommandShared.TryGetOptionValue(args, "--api-base-url");
        string baseUrl = CliCommandShared.GetBaseUrl(config);

        return string.IsNullOrWhiteSpace(apiOverride) ? baseUrl : apiOverride.Trim().TrimEnd('/');
    }
}
