namespace ArchLucid.Core.Configuration;

/// <summary>SQL client pool and MARS defaults for hosted deployments (TB-591).</summary>
public sealed class SqlConnectionPoolOptions
{
    public const string SectionPath = "ArchLucid:SqlConnectionPool";

    /// <summary>When set, overrides <see cref="Microsoft.Data.SqlClient.SqlConnectionStringBuilder.MaxPoolSize" />.</summary>
    public int? MaxPoolSize
    {
        get;
        init;
    }

    /// <summary>When set, overrides <see cref="Microsoft.Data.SqlClient.SqlConnectionStringBuilder.MultipleActiveResultSets" />.</summary>
    public bool? MultipleActiveResultSets
    {
        get;
        init;
    }
}
