using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Admin;
using ArchLucid.Persistence.Connections;

namespace ArchLucid.Persistence.Admin;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via integration tests.")]
public sealed partial class DapperUserInvitationRepository(ISqlConnectionFactory connectionFactory) : IUserInvitationRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private sealed class InvitationRow
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

        public Guid WorkspaceId
        {
            get;
            init;
        }

        public string Email
        {
            get;
            init;
        } = string.Empty;

        public string AppRole
        {
            get;
            init;
        } = string.Empty;

        public string InvitedByActorId
        {
            get;
            init;
        } = string.Empty;

        public string? Message
        {
            get;
            init;
        }

        public string Status
        {
            get;
            init;
        } = string.Empty;

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public DateTime ExpiresUtc
        {
            get;
            init;
        }

        public DateTime? RevokedUtc
        {
            get;
            init;
        }

        public DateTime? AcceptedUtc
        {
            get;
            init;
        }

        public UserInvitationRecord ToRecord()
        {
            if (!Enum.TryParse(Status, ignoreCase: true, out UserInvitationStatus status))
            {
                status = UserInvitationStatus.Pending;
            }

            return new UserInvitationRecord
            {
                Id = Id,
                TenantId = TenantId,
                WorkspaceId = WorkspaceId,
                Email = Email,
                AppRole = AppRole,
                InvitedByActorId = InvitedByActorId,
                Message = Message,
                Status = status,
                CreatedUtc = new DateTimeOffset(DateTime.SpecifyKind(CreatedUtc, DateTimeKind.Utc)),
                ExpiresUtc = new DateTimeOffset(DateTime.SpecifyKind(ExpiresUtc, DateTimeKind.Utc)),
                RevokedUtc = RevokedUtc is null
                    ? null
                    : new DateTimeOffset(DateTime.SpecifyKind(RevokedUtc.Value, DateTimeKind.Utc)),
                AcceptedUtc = AcceptedUtc is null
                    ? null
                    : new DateTimeOffset(DateTime.SpecifyKind(AcceptedUtc.Value, DateTimeKind.Utc))
            };
        }
    }
}
