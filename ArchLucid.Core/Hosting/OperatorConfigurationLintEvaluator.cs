using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Core.Hosting;

/// <summary>
///     Shared evaluator for operator-facing configuration lint (HTTP admin route and CLI).
/// </summary>
public static class OperatorConfigurationLintEvaluator
{
    /// <summary>
    ///     Builds blocking + advisory lists from live <paramref name="configuration" /> and the ASP.NET Core-style
    ///     environment name (same semantics as <c>IHostEnvironment.EnvironmentName</c>).
    /// </summary>
    /// <param name="azureOpenAiTcpReachabilityProbe">
    ///     Optional unit-test hook for Azure OpenAI TCP reachability; default uses
    ///     <see cref="AzureOpenAiEndpointConnectivitySocketProbe.IsTcpReachableAsync" /> under a 2s budget.
    /// </param>
    public static OperatorConfigurationLintSnapshot Evaluate(
        IConfiguration configuration,
        string aspNetCoreEnvironmentName,
        Func<Uri, CancellationToken, Task<bool>>? azureOpenAiTcpReachabilityProbe = null)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        if (string.IsNullOrWhiteSpace(aspNetCoreEnvironmentName))
            throw new ArgumentException("ASP.NET Core environment name is required.", nameof(aspNetCoreEnvironmentName));

        string trimmedEnv = aspNetCoreEnvironmentName.Trim();

        List<HostingMisconfigurationWarning> blocking = [];

        blocking.AddRange(DescribeAuthProductionLikeBlocking(configuration, trimmedEnv));

        blocking.AddRange(ProductionDangerousMisconfigurationLint.DescribeFailFastFindings(configuration, trimmedEnv));

        blocking.AddRange(
            AzureAiSearchProductionLikeConfigurationLint.DescribeBlockingFindings(configuration, trimmedEnv));

        List<HostingMisconfigurationWarning> advisory =
            ProductionLikeHostingMisconfigurationAdvisor.DescribeWarningRecords(configuration, trimmedEnv).ToList();

        advisory.AddRange(
            ProductionLikeSecretTransportConfigurationLint.DescribeAdvisoryFindings(configuration, trimmedEnv));

        HostingMisconfigurationWarning? qualityGateWarnOnly =
            QualityGateWarnOnlyProductionLikeConfigurationLint.TryDescribeAdvisoryFinding(configuration, trimmedEnv);

        if (qualityGateWarnOnly is not null)
            advisory.Add(qualityGateWarnOnly.Value);

        HostingMisconfigurationWarning? openAiConnectivity =
            AzureOpenAiEndpointConnectivityLintAdvisor.TryDescribeConnectivityFinding(
                configuration,
                azureOpenAiTcpReachabilityProbe);

        if (openAiConnectivity is not null)
            advisory.Add(openAiConnectivity.Value);

        return new OperatorConfigurationLintSnapshot(trimmedEnv, blocking, advisory);
    }

    /// <summary>
    ///     Mirrors legacy <c>archlucid config lint</c> auth traps: production-like hosting requires JwtBearer or ApiKey when
    ///     <c>ArchLucidAuth:Mode</c> is set.
    /// </summary>
    private static List<HostingMisconfigurationWarning> DescribeAuthProductionLikeBlocking(
        IConfiguration cfg,
        string hostingEnvironmentName)
    {
        List<HostingMisconfigurationWarning> findings = [];

        bool isDevelopment =
            string.Equals(hostingEnvironmentName, Environments.Development, StringComparison.OrdinalIgnoreCase);

        string? archLucidEnv = cfg["ARCHLUCID_ENVIRONMENT"] ?? Environment.GetEnvironmentVariable("ARCHLUCID_ENVIRONMENT");

        bool envImpliesProductionLike =
            HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike(hostingEnvironmentName)
            || HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike(archLucidEnv ?? string.Empty);

        bool nonDevelopmentHosting = !isDevelopment || envImpliesProductionLike;

        string modeTrim =
            cfg["ArchLucidAuth:Mode"]?.Trim() ?? string.Empty;

        if (!nonDevelopmentHosting || modeTrim.Length <= 0)
            return findings;

        bool jwt = string.Equals(modeTrim, "JwtBearer", StringComparison.OrdinalIgnoreCase);

        bool apiKey = string.Equals(modeTrim, "ApiKey", StringComparison.OrdinalIgnoreCase);

        if (!jwt && !apiKey)
        {
            findings.Add(
                new HostingMisconfigurationWarning(
                    "ArchLucidAuthModeProductionLikeRequirement",
                    "ArchLucidAuth:Mode must be JwtBearer or ApiKey when set for production-like hosting."));
        }

        return findings;
    }
}
