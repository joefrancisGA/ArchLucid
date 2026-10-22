using System.Globalization;

using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Hosting;

/// <summary>
///     Advisory config-lint rows when <c>AzureOpenAI:Endpoint</c> looks unusable from this machine (DNS/firewall).
/// </summary>
public static class AzureOpenAiEndpointConnectivityLintAdvisor
{
    public const string UnreachableRuleName = "AzureOpenAiEndpointUnreachable";

    public const string InvalidUrlRuleName = "AzureOpenAiEndpointInvalidUrl";

    /// <summary>Rules surfaced by <c>archlucid config lint</c> even without <c>--hosting-advisor</c>.</summary>
    public static bool IsConnectivitySurfaceRule(string ruleName)
    {
        if (string.IsNullOrWhiteSpace(ruleName)) return false;

        return string.Equals(ruleName.Trim(), UnreachableRuleName, StringComparison.OrdinalIgnoreCase)
               || string.Equals(ruleName.Trim(), InvalidUrlRuleName, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    ///     Returns an advisory finding when Real-mode Azure OpenAI is expected but the endpoint cannot be reached quickly.
    /// </summary>
    /// <param name="tcpReachabilityProbe">
    ///     Optional test override; default performs a timed TCP connect to the authority host/port.
    /// </param>
    public static HostingMisconfigurationWarning? TryDescribeConnectivityFinding(
        IConfiguration configuration,
        Func<Uri, CancellationToken, Task<bool>>? tcpReachabilityProbe = null)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        if (!AzureOpenAiExecutionProbePolicy.ShouldProbeConfiguredEndpoint(configuration))
            return null;

        string? endpoint = configuration["AzureOpenAI:Endpoint"]?.Trim();

        if (string.IsNullOrWhiteSpace(endpoint))
            return null;

        if (!Uri.TryCreate(endpoint, UriKind.Absolute, out Uri? resourceUri))
        {
            return new HostingMisconfigurationWarning(
                InvalidUrlRuleName,
                "AzureOpenAI:Endpoint must be a valid absolute URL for Real agent mode (example: https://{resource}.openai.azure.com/).");
        }

        Uri authority = new(resourceUri.GetLeftPart(UriPartial.Authority));

        Func<Uri, CancellationToken, Task<bool>> probe =
            tcpReachabilityProbe ?? AzureOpenAiEndpointConnectivitySocketProbe.IsTcpReachableAsync;

        try
        {
            using CancellationTokenSource budget = new();
            budget.CancelAfter(AzureOpenAiEndpointConnectivityLintLimits.SocketProbeTimeout);

            Task<bool> probeTask = probe(authority, budget.Token);
            bool reachable = probeTask.GetAwaiter().GetResult();

            if (reachable)
                return null;

            return Unreachable(authority, "connectivity probe returned false.");
        }
        catch (OperationCanceledException)
        {
            return Unreachable(
                authority,
                string.Format(
                    CultureInfo.InvariantCulture,
                    "timed out after {0} seconds (DNS or TCP connect).",
                    AzureOpenAiEndpointConnectivityLintLimits.SocketProbeTimeout.TotalSeconds));
        }
        catch (Exception ex)
        {
            return Unreachable(authority, ex.Message);
        }
    }

    private static HostingMisconfigurationWarning Unreachable(Uri authority, string detail)
    {
        int port = authority.IsDefaultPort
            ? string.Equals(authority.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase)
                ? 443
                : 80
            : authority.Port;

        return new HostingMisconfigurationWarning(
            UnreachableRuleName,
            string.Format(
                CultureInfo.InvariantCulture,
                "Azure OpenAI endpoint '{0}' (TCP {1}) was not reachable from this environment ({2}) "
                + "Verify DNS, outbound access, private endpoints, and AzureOpenAI:Endpoint.",
                authority.Host,
                port,
                detail));
    }
}
