namespace ArchLucid.Core.Tenancy;

/// <summary>Reason a tenant trial write was rejected by <see cref="TrialLimitGate"/> or persistence.</summary>
public enum TrialLimitReason
{
    Expired,

    RunsExceeded,

    SeatsExceeded,
}
