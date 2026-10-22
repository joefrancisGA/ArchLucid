using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Authorization;
using ArchLucid.Persistence.Connections;

namespace ArchLucid.Persistence.Authorization;

[ExcludeFromCodeCoverage(Justification = "SQL integration; covered via API tests.")]
public sealed partial class SqlCustomRoleRepository(
    ISqlConnectionFactory connectionFactory,
    SqlResilientOperationExecutor sqlOperations) : ICustomRoleRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly SqlResilientOperationExecutor _sqlOperations =
        sqlOperations ?? throw new ArgumentNullException(nameof(sqlOperations));

    public Task<IReadOnlyList<CustomRoleRecord>> ListByTenantAsync(Guid tenantId, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => ListByTenantCoreAsync(tenantId, ct), cancellationToken);

    public Task<CustomRoleRecord?> TryGetAsync(Guid tenantId, Guid roleId, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => TryGetCoreAsync(tenantId, roleId, ct), cancellationToken);

    public Task<CustomRoleRecord> CreateAsync(CustomRoleRecord record, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => CreateCoreAsync(record, ct), cancellationToken);

    public Task<CustomRoleRecord> UpdateAsync(CustomRoleRecord record, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => UpdateCoreAsync(record, ct), cancellationToken);

    public Task DeleteAsync(Guid tenantId, Guid roleId, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => DeleteCoreAsync(tenantId, roleId, ct), cancellationToken);

    public Task<IReadOnlyList<CustomRoleAssignmentWithRole>> ListAssignmentsForUserAsync(
        Guid tenantId,
        Guid userId,
        CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => ListAssignmentsForUserCoreAsync(tenantId, userId, ct), cancellationToken);

    public Task AssignAsync(UserCustomRoleAssignmentRecord assignment, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => AssignCoreAsync(assignment, ct), cancellationToken);

    public Task RemoveAssignmentAsync(
        Guid tenantId,
        Guid userId,
        Guid customRoleId,
        CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => RemoveAssignmentCoreAsync(tenantId, userId, customRoleId, ct), cancellationToken);

    public Task EnsureBuiltInRolesSeededAsync(Guid tenantId, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => EnsureBuiltInRolesSeededCoreAsync(tenantId, ct), cancellationToken);
}
