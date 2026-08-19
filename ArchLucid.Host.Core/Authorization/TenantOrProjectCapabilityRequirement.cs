using ArchLucid.Core.Authorization;

using Microsoft.AspNetCore.Authorization;

namespace ArchLucid.Host.Core.Authorization;

/// <inheritdoc />
public sealed class TenantOrProjectCapabilityRequirement(TenantOrProjectCapabilityMode mode) : IAuthorizationRequirement
{
    public TenantOrProjectCapabilityMode Mode
    {
        get;
    } = mode;
}
