using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; integration-tested separately.")]
public sealed partial class BackgroundJobRepository(IDbConnectionFactory connectionFactory) : IBackgroundJobRepository
{
    private static bool IsTerminalJobState(string state)
    {
        return string.Equals(state, "Succeeded", StringComparison.OrdinalIgnoreCase) || string.Equals(state, "Failed", StringComparison.OrdinalIgnoreCase);
    }
}
