namespace ArchLucid.Contracts.Alerts;

/// <summary>Workspace readiness signals for the alerts inbox empty states.</summary>
public sealed class AlertsInboxWorkspaceContextResponse
{
    public bool HasAlertRules
    {
        get;
        init;
    }

    public bool HasReviews
    {
        get;
        init;
    }
}
