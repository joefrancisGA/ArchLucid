namespace ArchLucid.Contracts.Requests;

/// <summary>Optional body for POST <c>/v1/architecture/run/{{runId}}/commit</c>.</summary>
public sealed class CommitRunRequest
{
    /// <summary>
    ///     When <see langword="true" />, sends a transactional email to the tenant provisioned admin contact
    ///     (when resolvable and email is configured) with a link to the run in the operator UI.
    /// </summary>
    public bool NotifySponsor
    {
        get;
        init;
    }

    /// <summary>
    ///     When the optional pre-commit governance gate would block commit, a non-empty break-glass justification allows
    ///     commit to proceed for callers with execute authority; emits <c>GovernanceBypassInvoked</c> audit with findings.
    /// </summary>
    public string? BypassJustification
    {
        get;
        init;
    }
}
