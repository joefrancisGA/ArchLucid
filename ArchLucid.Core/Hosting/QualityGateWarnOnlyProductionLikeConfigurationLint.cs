using System.Globalization;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Hosting;

/// <summary>
///     Flags Real-mode production-like hosts still on <see cref="AgentOutputQualityGateMode.WarnOnly" /> (TB-213).
/// </summary>
public static class QualityGateWarnOnlyProductionLikeConfigurationLint
{
    public const string AgentExecutionModeKey = "AgentExecution:Mode";

    public const string QualityGateModeKey = "ArchLucid:AgentOutput:QualityGate:Mode";

    /// <summary>
    ///     Returns an advisory finding when production-like hosting runs Real agents with WarnOnly quality-gate posture.
    /// </summary>
    public static HostingMisconfigurationWarning? TryDescribeAdvisoryFinding(
        IConfiguration configuration,
        string aspNetCoreEnvironmentName)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        if (string.IsNullOrWhiteSpace(aspNetCoreEnvironmentName))
            throw new ArgumentException("ASP.NET Core environment name is required.", nameof(aspNetCoreEnvironmentName));

        if (!ShouldEmitFinding(configuration, aspNetCoreEnvironmentName.Trim()))
            return null;

        return new HostingMisconfigurationWarning(
            ProductionLikeHostingMisconfigurationAdvisorRuleNames.QualityGateWarnOnlyInRealProductionLike,
            "AgentExecution:Mode is Real with ArchLucid:AgentOutput:QualityGate:Mode=WarnOnly on production-like hosting. "
            + "Sponsor-facing pilots should use PilotStrict with enforce/block flags for defensible proof.");
    }

    internal static bool ShouldEmitFinding(IConfiguration configuration, string aspNetCoreEnvironmentName)
    {
        if (!ProductionLikeHostingMisconfigurationAdvisor.IsProductionLikeHosting(
                aspNetCoreEnvironmentName,
                configuration))
            return false;

        if (!string.Equals(
                configuration[AgentExecutionModeKey]?.Trim(),
                "Real",
                StringComparison.OrdinalIgnoreCase))
            return false;

        string modeRaw = configuration[QualityGateModeKey]?.Trim() ?? string.Empty;

        if (modeRaw.Length == 0)
            return true;

        if (TryParseWholeNumberString(modeRaw, out int numeric))
        {
            if (!Enum.IsDefined(typeof(AgentOutputQualityGateMode), numeric))
                return true;

            return (AgentOutputQualityGateMode)numeric == AgentOutputQualityGateMode.WarnOnly;
        }

        if (TryParseBooleanOrdinalString(modeRaw, out int booleanOrdinal))
        {
            if (!Enum.IsDefined(typeof(AgentOutputQualityGateMode), booleanOrdinal))
                return true;

            return (AgentOutputQualityGateMode)booleanOrdinal == AgentOutputQualityGateMode.WarnOnly;
        }

        if (Enum.TryParse(modeRaw, ignoreCase: true, out AgentOutputQualityGateMode parsed) && Enum.IsDefined(parsed))
            return parsed == AgentOutputQualityGateMode.WarnOnly;

        return string.Equals(modeRaw, "WarnOnly", StringComparison.OrdinalIgnoreCase);
    }

    private static bool TryParseBooleanOrdinalString(string raw, out int ordinal)
    {
        if (TryParseBooleanString(raw, out bool boolean))
        {
            ordinal = boolean ? 1 : 0;

            return true;
        }

        ordinal = default;

        return false;
    }

    private static bool TryParseBooleanString(string? raw, out bool value)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            value = default;

            return false;
        }

        string trimmed = raw.Trim();

        if (trimmed.Equals("true", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("1", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("yes", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("on", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("enabled", StringComparison.OrdinalIgnoreCase))
        {
            value = true;

            return true;
        }

        if (trimmed.Equals("false", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("0", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("no", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("off", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("disabled", StringComparison.OrdinalIgnoreCase))
        {
            value = false;

            return true;
        }

        value = default;

        return false;
    }

    private static bool TryParseWholeNumberString(string raw, out int value)
    {
        if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
        {
            return true;
        }

        if (double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric == Math.Floor(numeric))
        {
            value = (int)numeric;

            return true;
        }

        value = default;

        return false;
    }
}
