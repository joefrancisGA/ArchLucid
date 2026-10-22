using ArchLucid.Core.Scim;
using ArchLucid.Core.Scim.Models;
using ArchLucid.Persistence.Connections;

namespace ArchLucid.Persistence.Scim;

public sealed partial class DapperScimUserRepository(ISqlConnectionFactory connectionFactory) : IScimUserRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private sealed class GroupKeyRow
    {
        public string DisplayName
        {
            get;
            init;
        } = string.Empty;

        public string ExternalId
        {
            get;
            init;
        } = string.Empty;
    }

    private sealed class UserRow
    {
        public Guid Id
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public string ExternalId
        {
            get;
            init;
        } = string.Empty;

        public string UserName
        {
            get;
            init;
        } = string.Empty;

        public string? DisplayName
        {
            get;
            init;
        }

        public bool Active
        {
            get;
            init;
        }

        public string? ResolvedRole
        {
            get;
            init;
        }

        public byte ResolvedRoleOrigin
        {
            get;
            init;
        }

        public DateTimeOffset CreatedUtc
        {
            get;
            init;
        }

        public DateTimeOffset UpdatedUtc
        {
            get;
            init;
        }

        public DateTimeOffset? DirectoryRemovedUtc
        {
            get;
            init;
        }

        internal ScimUserRecord ToRecord()
        {
            return new ScimUserRecord
            {
                Id = Id,
                TenantId = TenantId,
                ExternalId = ExternalId,
                UserName = UserName,
                DisplayName = DisplayName,
                Active = Active,
                ResolvedRole = ResolvedRole,
                ResolvedRoleOrigin = (ScimResolvedRoleOrigin)ResolvedRoleOrigin,
                DirectoryRemovedUtc = DirectoryRemovedUtc,
                CreatedUtc = CreatedUtc,
                UpdatedUtc = UpdatedUtc
            };
        }
    }
}
