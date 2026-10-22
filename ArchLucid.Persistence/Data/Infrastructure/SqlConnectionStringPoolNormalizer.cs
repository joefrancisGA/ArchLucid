using ArchLucid.Core.Configuration;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Infrastructure;

/// <summary>Applies optional pool/MARS overrides from <see cref="SqlConnectionPoolOptions" /> (TB-591).</summary>
public static class SqlConnectionStringPoolNormalizer
{
    public static string Apply(string connectionString, SqlConnectionPoolOptions? poolOptions)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("Connection string is required.", nameof(connectionString));

        if (poolOptions is null)
            return connectionString.Trim();

        if (!poolOptions.MaxPoolSize.HasValue && !poolOptions.MultipleActiveResultSets.HasValue)
            return connectionString.Trim();

        SqlConnectionStringBuilder builder = new(connectionString.Trim());

        if (poolOptions.MaxPoolSize is int maxPoolSize)
        {
            if (maxPoolSize < 1)
                throw new InvalidOperationException("ArchLucid:SqlConnectionPool:MaxPoolSize must be at least 1.");

            builder.MaxPoolSize = maxPoolSize;
        }

        if (poolOptions.MultipleActiveResultSets is bool mars)
            builder.MultipleActiveResultSets = mars;

        return builder.ConnectionString;
    }
}
