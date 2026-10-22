using ArchLucid.Application.Scim.Filtering;
using ArchLucid.Application.Scim.Patching;
using ArchLucid.Application.Scim.RoleMapping;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scim.Filtering;
using ArchLucid.Core.Scim.Models;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Scim;

public sealed partial class ScimUserService(
    IScimUserRepository users,
    ITenantRepository tenants,
    IGroupToRoleMapper roleMapper,
    IAuditService audit,
    ILogger<ScimUserService> logger) : IScimUserService
{
    internal const string ManualResolvedRoleFlatPath = "manualResolvedRole";
    private readonly IAuditService _audit = audit ?? throw new ArgumentNullException(nameof(audit));
    private readonly ILogger<ScimUserService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IGroupToRoleMapper _roleMapper = roleMapper ?? throw new ArgumentNullException(nameof(roleMapper));
    private readonly ITenantRepository _tenants = tenants ?? throw new ArgumentNullException(nameof(tenants));
    private readonly IScimUserRepository _users = users ?? throw new ArgumentNullException(nameof(users));
}

public sealed class ScimConflictException : Exception
{
    public ScimConflictException(string message) : base(message)
    {
        ArgumentNullException.ThrowIfNull(message);
    }
}

public sealed class ScimNotFoundException : Exception
{
    public ScimNotFoundException(string message) : base(message)
    {
        ArgumentNullException.ThrowIfNull(message);
    }
}
