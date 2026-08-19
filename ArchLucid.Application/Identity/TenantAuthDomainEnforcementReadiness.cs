using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public sealed class TenantAuthDomainEnforcementChecklistItem
{
    public string Key
    {
        get;
        init;
    } = string.Empty;

    public string Label
    {
        get;
        init;
    } = string.Empty;

    public bool Complete
    {
        get;
        init;
    }

    public bool Required
    {
        get;
        init;
    }

    public string? Detail
    {
        get;
        init;
    }
}

public sealed class TenantAuthDomainEnforcementReadiness
{
    public bool CanEnableEnforcement
    {
        get;
        init;
    }

    public bool HasRecoveryRoute
    {
        get;
        init;
    }

    public bool BlockEnforcement
    {
        get;
        init;
    }

    public string? BlockReason
    {
        get;
        init;
    }

    public IReadOnlyList<TenantAuthDomainEnforcementChecklistItem> Checklist
    {
        get;
        init;
    } = [];
}

public sealed class TenantAuthDomainRecoveryAdminRemovalResult
{
    public bool Removed
    {
        get;
        init;
    }

    public bool WasLastRecoveryAdmin
    {
        get;
        init;
    }

    public string? WarningMessage
    {
        get;
        init;
    }
}
