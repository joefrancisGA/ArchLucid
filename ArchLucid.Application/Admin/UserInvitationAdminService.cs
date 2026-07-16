using System.Net.Mail;
using System.Security.Cryptography;

using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Admin;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Admin;

public interface IUserInvitationAdminService
{
    Task<UserInvitationResponse> InviteAsync(
        ScopeContext scope,
        string invitedByActorId,
        CreateUserInvitationRequest request,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<UserInvitationResponse>> ListAsync(ScopeContext scope, CancellationToken cancellationToken);

    Task<bool> RevokeAsync(ScopeContext scope, Guid invitationId, CancellationToken cancellationToken);
}

public sealed class UserInvitationAdminService(
    IUserInvitationRepository invitations,
    IScimUserRepository scimUsers,
    ITenantRepository tenants,
    TimeProvider timeProvider) : IUserInvitationAdminService
{
    private static readonly HashSet<string> AssignableRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        ArchLucidRoles.Admin,
        ArchLucidRoles.Operator,
        ArchLucidRoles.Reader,
        ArchLucidRoles.Auditor
    };

    private const int DefaultExpiryDays = 14;
    private const int MaxMessageLength = 2000;

    private readonly IUserInvitationRepository _invitations =
        invitations ?? throw new ArgumentNullException(nameof(invitations));

    private readonly IScimUserRepository _scimUsers =
        scimUsers ?? throw new ArgumentNullException(nameof(scimUsers));

    private readonly ITenantRepository _tenants = tenants ?? throw new ArgumentNullException(nameof(tenants));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task<UserInvitationResponse> InviteAsync(
        ScopeContext scope,
        string invitedByActorId,
        CreateUserInvitationRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(invitedByActorId);
        ArgumentNullException.ThrowIfNull(request);

        if (!TryNormalizeEmail(request.Email, out string normalizedEmail))
        {
            throw new ArgumentException("Email address is not valid.", nameof(request));
        }

        string appRole = request.AppRole?.Trim() ?? string.Empty;

        if (!AssignableRoles.Contains(appRole))
        {
            throw new ArgumentException(
                "AppRole must be Admin, Operator, Reader, or Auditor.",
                nameof(request));
        }

        string? message = NormalizeOptionalMessage(request.Message);

        if (await DirectoryUserExistsByEmailAsync(scope.TenantId, normalizedEmail, cancellationToken))
        {
            throw new UserInvitationDirectoryUserExistsException(normalizedEmail);
        }

        UserInvitationRecord? pending =
            await _invitations.GetPendingByEmailAsync(scope.TenantId, normalizedEmail, cancellationToken);

        if (pending is not null && pending.ExpiresUtc > _timeProvider.GetUtcNow())
        {
            return await MapResponseAsync(pending, cancellationToken);
        }

        DateTimeOffset expiresUtc = _timeProvider.GetUtcNow().AddDays(DefaultExpiryDays);
        byte[] tokenHash = HashInvitationToken(RandomNumberGenerator.GetBytes(32));

        UserInvitationRecord created = await _invitations.InsertAsync(
            scope.TenantId,
            scope.WorkspaceId,
            normalizedEmail,
            appRole,
            invitedByActorId.Trim(),
            message,
            tokenHash,
            expiresUtc,
            cancellationToken);

        return await MapResponseAsync(created, cancellationToken);
    }

    public async Task<IReadOnlyList<UserInvitationResponse>> ListAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        IReadOnlyList<UserInvitationRecord> rows =
            await _invitations.ListByTenantAsync(scope.TenantId, cancellationToken);

        List<UserInvitationResponse> responses = [];

        foreach (UserInvitationRecord row in rows)
        {
            responses.Add(await MapResponseAsync(row, cancellationToken));
        }

        return responses;
    }

    public Task<bool> RevokeAsync(ScopeContext scope, Guid invitationId, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return _invitations.RevokeAsync(
            scope.TenantId,
            invitationId,
            _timeProvider.GetUtcNow(),
            cancellationToken);
    }

    internal static bool TryNormalizeEmail(string email, out string normalizedEmail)
    {
        normalizedEmail = string.Empty;

        if (string.IsNullOrWhiteSpace(email))
        {
            return false;
        }

        try
        {
            MailAddress parsed = new(email.Trim());

            if (string.IsNullOrWhiteSpace(parsed.Address))
            {
                return false;
            }

            normalizedEmail = parsed.Address.Trim().ToLowerInvariant();

            return normalizedEmail.Contains('@');
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static string? NormalizeOptionalMessage(string? message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            return null;
        }

        string trimmed = message.Trim();

        if (trimmed.Length > MaxMessageLength)
        {
            throw new ArgumentException($"Message must be at most {MaxMessageLength} characters.", nameof(message));
        }

        return trimmed;
    }

    private static byte[] HashInvitationToken(byte[] tokenBytes)
    {
        return SHA256.HashData(tokenBytes);
    }

    private async Task<bool> DirectoryUserExistsByEmailAsync(
        Guid tenantId,
        string normalizedEmail,
        CancellationToken cancellationToken)
    {
        const int pageSize = 200;
        int startIndex = 1;

        while (true)
        {
            (IReadOnlyList<Core.Scim.Models.ScimUserRecord> items, int totalCount) page =
                await _scimUsers.ListAsync(tenantId, null, startIndex, pageSize, cancellationToken);

            if (page.items.Any(user =>
                    string.Equals(user.UserName, normalizedEmail, StringComparison.OrdinalIgnoreCase)))
            {
                return true;
            }

            if (startIndex + pageSize > page.totalCount || page.items.Count == 0)
            {
                return false;
            }

            startIndex += pageSize;
        }
    }

    private string ResolveDisplayStatus(UserInvitationRecord record)
    {
        if (record.Status == UserInvitationStatus.Pending && record.ExpiresUtc < _timeProvider.GetUtcNow())
        {
            return "Expired";
        }

        return record.Status.ToString();
    }

    private async Task<UserInvitationResponse> MapResponseAsync(
        UserInvitationRecord record,
        CancellationToken cancellationToken)
    {
        TenantRecord? tenant = await _tenants.GetByIdAsync(record.TenantId, cancellationToken);
        string tenantName = tenant?.Name ?? "—";

        return new UserInvitationResponse
        {
            Id = record.Id,
            Email = record.Email,
            AppRole = record.AppRole,
            Status = ResolveDisplayStatus(record),
            TenantName = tenantName,
            WorkspaceId = record.WorkspaceId,
            InvitedByActorId = record.InvitedByActorId,
            Message = record.Message,
            CreatedUtc = record.CreatedUtc,
            ExpiresUtc = record.ExpiresUtc
        };
    }
}
