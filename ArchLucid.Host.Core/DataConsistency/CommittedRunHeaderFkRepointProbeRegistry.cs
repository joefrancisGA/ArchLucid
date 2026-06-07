using System.Reflection;

using ArchLucid.Core.Persistence;

namespace ArchLucid.Host.Core.DataConsistency;

/// <summary>
///     Resolves TB-311 repoint probe SQL for <see cref="CommittedRunHeaderFkRepointRegistry" /> entries.
/// </summary>
public static class CommittedRunHeaderFkRepointProbeRegistry
{
    public static string ResolveCountSql(CommittedRunHeaderFkRepointRegistration registration)
    {
        ArgumentNullException.ThrowIfNull(registration);

        if (string.IsNullOrWhiteSpace(registration.SqlConstantName))
        {
            throw new InvalidOperationException(
                $"Registration for dbo.Runs.{registration.PointerColumnName} is missing {nameof(CommittedRunHeaderFkRepointRegistration.SqlConstantName)}.");
        }

        FieldInfo? field = typeof(CommittedRunHeaderFkRepointProbeSql).GetField(
            registration.SqlConstantName,
            BindingFlags.Public | BindingFlags.Static);

        if (field is null || field.FieldType != typeof(string))
        {
            throw new InvalidOperationException(
                $"Expected public const string {registration.SqlConstantName} on {nameof(CommittedRunHeaderFkRepointProbeSql)}.");
        }

        string? sql = field.GetValue(null) as string;

        if (string.IsNullOrWhiteSpace(sql))
        {
            throw new InvalidOperationException(
                $"Probe SQL constant {registration.SqlConstantName} must be non-empty.");
        }

        return sql;
    }
}
