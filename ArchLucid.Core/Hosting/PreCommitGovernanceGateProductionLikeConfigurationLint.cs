using ArchLucid.Contracts.Governance;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Hosting;

/// <summary>
///     Flags production-like hosts with <see cref="PreCommitGovernanceGateOptions.PreCommitGateEnabled" /> disabled (DR-04).
/// </summary>
public static class PreCommitGovernanceGateProductionLikeConfigurationLint
{
    /// <summary>Returns a blocking finding when production-like hosting leaves the pre-finalize gate off.</summary>
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
            ProductionLikeHostingMisconfigurationAdvisorRuleNames.PreCommitGovernanceGateDisabledProductionLike,
            "ArchLucid:Governance:PreCommitGateEnabled is false on production-like hosting. "
            + "Working career exports and finalize honesty require the pre-finalize governance gate on hosted pilots.");
    }

    internal static bool IsGateEnabled(IConfiguration configuration)
    {
        IConfigurationSection section = configuration.GetSection(PreCommitGovernanceGateOptions.SectionPath);

        return section.GetValue<bool>(nameof(PreCommitGovernanceGateOptions.PreCommitGateEnabled));
    }
}
