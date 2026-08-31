using System.Data.Common;
using System.Globalization;

using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Intake;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Application.Intake;

public interface IWizardIntakeDraftService
{
    Task<WizardIntakeDraftResponse?> GetAsync(ScopeContext scope, string wizardId, CancellationToken cancellationToken);

    Task<WizardIntakeDraftResponse> UpsertAsync(
        ScopeContext scope,
        string wizardId,
        UpsertWizardIntakeDraftRequest request,
        CancellationToken cancellationToken);
}

public sealed class WizardIntakeDraftService(
    IDbConnectionFactory connectionFactory,
    IArchLucidStorageMode storageMode,
    TimeProvider timeProvider) : IWizardIntakeDraftService
{
    private static readonly Lock InMemoryGate = new();
    private static readonly Dictionary<string, WizardIntakeDraftResponse> InMemory = new(StringComparer.Ordinal);

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task<WizardIntakeDraftResponse?> GetAsync(
        ScopeContext scope,
        string wizardId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(wizardId);

        if (storageMode.IsInMemory)
        {
            lock (InMemoryGate)
            {
                return InMemory.TryGetValue(BuildKey(scope, wizardId), out WizardIntakeDraftResponse? draft)
                    ? draft
                    : null;
            }
        }

        await using DbConnection connection =
            (DbConnection)await connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        await using DbCommand command = connection.CreateCommand();
        command.CommandText = """
                              SELECT WizardId, StepIndex, StateJson, UpdatedUtc
                              FROM dbo.WizardIntakeDrafts
                              WHERE TenantId = @TenantId
                                AND WorkspaceId = @WorkspaceId
                                AND WizardId = @WizardId
                              """;

        AddParameter(command, "@TenantId", scope.TenantId);
        AddParameter(command, "@WorkspaceId", scope.WorkspaceId);
        AddParameter(command, "@WizardId", wizardId.Trim());

        await using DbDataReader reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);

        if (!await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            return null;

        return new WizardIntakeDraftResponse
        {
            WizardId = reader.GetString(0),
            StepIndex = reader.GetInt32(1),
            StateJson = reader.GetString(2),
            UpdatedUtc = reader.GetDateTime(3),
        };
    }

    public async Task<WizardIntakeDraftResponse> UpsertAsync(
        ScopeContext scope,
        string wizardId,
        UpsertWizardIntakeDraftRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(wizardId);

        DateTime updatedUtc = _timeProvider.GetUtcNow().UtcDateTime;
        byte[]? idempotencyHash = string.IsNullOrWhiteSpace(request.IdempotencyKey)
            ? null
            : ArchitectureRunIdempotencyHashing.HashIdempotencyKey(request.IdempotencyKey.Trim());

        WizardIntakeDraftResponse response = new()
        {
            WizardId = wizardId.Trim(),
            StepIndex = request.StepIndex,
            StateJson = request.StateJson,
            UpdatedUtc = updatedUtc,
        };

        if (storageMode.IsInMemory)
        {
            InMemory[BuildKey(scope, wizardId)] = response;
            return response;
        }

        await using DbConnection connection =
            (DbConnection)await connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        await using DbCommand command = connection.CreateCommand();
        command.CommandText = """
                              MERGE dbo.WizardIntakeDrafts AS target
                              USING (SELECT @TenantId AS TenantId, @WorkspaceId AS WorkspaceId, @WizardId AS WizardId) AS source
                              ON target.TenantId = source.TenantId
                                 AND target.WorkspaceId = source.WorkspaceId
                                 AND target.WizardId = source.WizardId
                              WHEN MATCHED THEN
                                  UPDATE SET StepIndex = @StepIndex,
                                             StateJson = @StateJson,
                                             IdempotencyKeyHash = @IdempotencyKeyHash,
                                             UpdatedUtc = @UpdatedUtc
                              WHEN NOT MATCHED THEN
                                  INSERT (TenantId, WorkspaceId, WizardId, StepIndex, StateJson, IdempotencyKeyHash, UpdatedUtc)
                                  VALUES (@TenantId, @WorkspaceId, @WizardId, @StepIndex, @StateJson, @IdempotencyKeyHash, @UpdatedUtc);
                              """;

        AddParameter(command, "@TenantId", scope.TenantId);
        AddParameter(command, "@WorkspaceId", scope.WorkspaceId);
        AddParameter(command, "@WizardId", wizardId.Trim());
        AddParameter(command, "@StepIndex", request.StepIndex);
        AddParameter(command, "@StateJson", request.StateJson);
        AddParameter(command, "@IdempotencyKeyHash", (object?)idempotencyHash ?? DBNull.Value);
        AddParameter(command, "@UpdatedUtc", updatedUtc);

        await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);

        return response;
    }

    private static string BuildKey(ScopeContext scope, string wizardId) =>
        $"{scope.TenantId:N}:{scope.WorkspaceId:N}:{wizardId.Trim()}";

    private static void AddParameter(DbCommand command, string name, object value)
    {
        DbParameter parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value;
        command.Parameters.Add(parameter);
    }
}
