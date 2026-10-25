using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

namespace ArchLucid.Application.Governance;

/// <summary>Shared copy when Working real-mode runs cannot earn career-complete posture under WarnOnly or Warned gates (DR-05).</summary>
public static class AgentOutputQualityGateCareerHonestyPresenter
{
    public const string WarnOnlyWorkingBannerMessage =
        "Quality gate is WarnOnly — this seal is not career-complete for real-mode analysis";

    public const string WarnedDispositionCareerExportBlockedReason =
        "Quality gate disposition is Warned — resolve warnings before career export";

    public const string RejectedDispositionCareerExportBlockedReason =
        "Quality gate disposition is Rejected — PilotStrict citation coverage or other floors block career export";

    public const string QualityGateModeNotStoredLabel = "Quality gate mode was not stored.";

    public static string FormatStampQualityGateModeLabel(
        AgentOutputQualityGateMode? recordedMode,
        AgentOutputQualityGateMode? hostMode)
    {
        if (recordedMode is AgentOutputQualityGateMode.PilotStrict)
        {
            return "Quality gate: PilotStrict";
        }

        if (recordedMode is AgentOutputQualityGateMode.WarnOnly)
        {
            return "Quality gate: WarnOnly";
        }

        if (hostMode is AgentOutputQualityGateMode.PilotStrict)
        {
            return "Quality gate: PilotStrict (host default)";
        }

        if (hostMode is AgentOutputQualityGateMode.WarnOnly)
        {
            return "Quality gate: WarnOnly (host default)";
        }

        return QualityGateModeNotStoredLabel;
    }

    public static bool RequiresWorkingCareerExportBlock(
        StructuralExecutionMode structuralExecutionMode,
        bool isSampleRun,
        string? hostAgentExecutionMode,
        AgentOutputQualityGateMode hostQualityGateMode,
        AgentOutputQualityGateOutcome? aggregateQualityGateOutcome)
    {
        if (isSampleRun)
        {
            return false;
        }

        if (structuralExecutionMode != StructuralExecutionMode.Real)
        {
            return false;
        }

        if (aggregateQualityGateOutcome == AgentOutputQualityGateOutcome.Warned)
        {
            return true;
        }

        if (hostQualityGateMode == AgentOutputQualityGateMode.PilotStrict
            && aggregateQualityGateOutcome == AgentOutputQualityGateOutcome.Rejected)
        {
            return true;
        }

        bool hostIsReal = string.Equals(hostAgentExecutionMode, "Real", StringComparison.OrdinalIgnoreCase);

        if (hostIsReal && hostQualityGateMode == AgentOutputQualityGateMode.WarnOnly)
        {
            return true;
        }

        return false;
    }

    public static string? FormatCareerExportBlockedReason(
        StructuralExecutionMode structuralExecutionMode,
        bool isSampleRun,
        string? hostAgentExecutionMode,
        AgentOutputQualityGateMode hostQualityGateMode,
        AgentOutputQualityGateOutcome? aggregateQualityGateOutcome)
    {
        if (!RequiresWorkingCareerExportBlock(
                structuralExecutionMode,
                isSampleRun,
                hostAgentExecutionMode,
                hostQualityGateMode,
                aggregateQualityGateOutcome))
        {
            return null;
        }

        if (aggregateQualityGateOutcome == AgentOutputQualityGateOutcome.Warned)
        {
            return WarnedDispositionCareerExportBlockedReason;
        }

        if (hostQualityGateMode == AgentOutputQualityGateMode.PilotStrict
            && aggregateQualityGateOutcome == AgentOutputQualityGateOutcome.Rejected)
        {
            return RejectedDispositionCareerExportBlockedReason;
        }

        return WarnOnlyWorkingBannerMessage;
    }
}
