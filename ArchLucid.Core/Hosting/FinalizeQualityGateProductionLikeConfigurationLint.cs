using ArchLucid.Contracts.Governance;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Hosting;

/// <summary>
///     Flags production-like hosts with <see cref="FinalizeQualityGateOptions.Enabled" /> disabled (TB-2321).
/// </summary>
public static class FinalizeQualityGateProductionLikeConfigurationLint
{
    /// <summary>Returns a blocking finding when production-like hosting leaves the scorecard gate off.</summary>
    public static HostingMisconfigurationWarning? TryDescribeBlockingFinding(
        IConfiguration configuration,
        string aspNetCoreEnvironmentName)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        if (string.IsNullOrWhiteSpace(aspNetCoreEnvironmentName))
            throw new ArgumentException("ASP.NET Core environment name is required.", nameof(aspNetCoreEnvironmentName));

        if (!ProductionLikeHostingMisconfigurationAdvisor.IsProductionLikeHosting(
                aspNetCoreEnvironmentName.Trim(),
                configuration))
            return null;

        if (IsGateEnabled(configuration))
            return null;

        return new HostingMisconfigurationWarning(
            ProductionLikeHostingMisconfigurationAdvisorRuleNames.FinalizeQualityGateDisabledProductionLike,
            "ArchLucid:FinalizeQualityGate:Enabled is false on production-like hosting. "
            + "Direct API callers could finalize packages the Finalize button refuses (TB-2321 scorecard).");
    }

    internal static bool IsGateEnabled(IConfiguration configuration)
    {
        IConfigurationSection section = configuration.GetSection(FinalizeQualityGateOptions.SectionPath);

        return section.GetValue<bool>(nameof(FinalizeQualityGateOptions.Enabled));
    }
}
