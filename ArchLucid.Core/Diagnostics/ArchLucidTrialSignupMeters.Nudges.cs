using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

public static partial class ArchLucidGrowthFunnelMeters
{
    /// <summary>Paid Team expansion nudge CTA clicks (label <c>trigger</c>).</summary>
    public static readonly Counter<long> TeamExpansionNudgeClickedTotal =
        ArchLucidAppMeter.Instance.CreateCounter<long>(
            "archlucid_team_expansion_nudge_clicked_total",
            description: "Team expansion nudge CTA clicks (label: trigger=seats|workspaces).");

    /// <summary>Paid Team expansion nudge renders in the operator shell (label <c>trigger</c>).</summary>
    public static readonly Counter<long> TeamExpansionNudgeShownTotal =
        ArchLucidAppMeter.Instance.CreateCounter<long>(
            "archlucid_team_expansion_nudge_shown_total",
            description: "Team expansion nudge shown in operator shell (label: trigger=seats|workspaces).");

    /// <summary>Usage-based trial upgrade nudge CTA clicks (label <c>trigger</c>).</summary>
    public static readonly Counter<long> TrialUpgradeNudgeClickedTotal =
        ArchLucidAppMeter.Instance.CreateCounter<long>(
            "archlucid_trial_upgrade_nudge_clicked_total",
            description: "Trial upgrade nudge CTA clicks (label: trigger=runs|seats|expiry).");

    /// <summary>Usage-based trial upgrade nudge renders in the operator shell (label <c>trigger</c>).</summary>
    public static readonly Counter<long> TrialUpgradeNudgeShownTotal =
        ArchLucidAppMeter.Instance.CreateCounter<long>(
            "archlucid_trial_upgrade_nudge_shown_total",
            description: "Trial upgrade nudge shown in operator shell (label: trigger=runs|seats|expiry).");

    private static readonly string[] TrialUpgradeNudgeTriggers = ["runs", "seats", "expiry"];

    private static readonly string[] TeamExpansionNudgeTriggers = ["seats", "workspaces"];

    /// <summary>Increments <see cref="TrialUpgradeNudgeShownTotal" />.</summary>
    public static void RecordTrialUpgradeNudgeShown(string trigger)
    {
        string t = NormalizeTrialUpgradeNudgeTrigger(trigger);
        TrialUpgradeNudgeShownTotal.Add(1, new TagList { { "trigger", t } });
    }

    /// <summary>Increments <see cref="TrialUpgradeNudgeClickedTotal" />.</summary>
    public static void RecordTrialUpgradeNudgeClicked(string trigger)
    {
        string t = NormalizeTrialUpgradeNudgeTrigger(trigger);
        TrialUpgradeNudgeClickedTotal.Add(1, new TagList { { "trigger", t } });
    }

    private static string NormalizeTrialUpgradeNudgeTrigger(string trigger)
    {
        string t = string.IsNullOrWhiteSpace(trigger) ? string.Empty : trigger.Trim();

        foreach (string knownTrigger in TrialUpgradeNudgeTriggers)
        {
            if (string.Equals(knownTrigger, t, StringComparison.OrdinalIgnoreCase))
                return knownTrigger;
        }

        return "unknown";
    }

    /// <summary>Increments <see cref="TeamExpansionNudgeShownTotal" />.</summary>
    public static void RecordTeamExpansionNudgeShown(string trigger)
    {
        string t = NormalizeTeamExpansionNudgeTrigger(trigger);
        TeamExpansionNudgeShownTotal.Add(1, new TagList { { "trigger", t } });
    }

    /// <summary>Increments <see cref="TeamExpansionNudgeClickedTotal" />.</summary>
    public static void RecordTeamExpansionNudgeClicked(string trigger)
    {
        string t = NormalizeTeamExpansionNudgeTrigger(trigger);
        TeamExpansionNudgeClickedTotal.Add(1, new TagList { { "trigger", t } });
    }

    private static string NormalizeTeamExpansionNudgeTrigger(string trigger)
    {
        string t = string.IsNullOrWhiteSpace(trigger) ? string.Empty : trigger.Trim();

        foreach (string knownTrigger in TeamExpansionNudgeTriggers)
        {
            if (string.Equals(knownTrigger, t, StringComparison.OrdinalIgnoreCase))
                return knownTrigger;
        }

        return "unknown";
    }
}
