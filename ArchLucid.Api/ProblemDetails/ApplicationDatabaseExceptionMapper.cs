using System.Data.Common;

using ArchLucid.Persistence.Connections;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

using static ArchLucid.Api.ProblemDetails.ApplicationProblemMapper;

namespace ArchLucid.Api.ProblemDetails;

/// <summary>
///     Maps SQL Server, timeout, and other <see cref="DbException" /> failures for
///     <see cref="ApplicationProblemMapper.TryMapDatabaseException" />.
/// </summary>
internal static class ApplicationDatabaseExceptionMapper
{
    internal static bool TryMapDatabaseException(
        Exception ex,
        string? instance,
        HttpContext httpContext,
        out ObjectResult? result)
    {
        result = null;

        if (ex is SqlException { Number: -2 })
        {
            result = CreateProblemResult(
                StatusCodes.Status503ServiceUnavailable,
                "Database Timeout",
                "The database query timed out. The request may succeed on retry.",
                ProblemTypes.DatabaseTimeout,
                instance,
                httpContext);
            return true;
        }

        // Parallel commits on the same run can deadlock; 409 matches other concurrency outcomes (ROWVERSION, unique key).

        if (TryFindSqlExceptionWithNumber(ex, 1205) is not null)
        {
            result = CreateProblemResult(
                StatusCodes.Status409Conflict,
                "Concurrency conflict",
                "The database transaction deadlocked with a concurrent request. Retry the commit.",
                ProblemTypes.Conflict,
                instance,
                httpContext);
            return true;
        }

        if (TryFindSqlProgrammingFault(ex) is not null)
        {
            result = CreateProblemResult(
                StatusCodes.Status500InternalServerError,
                "Database Query Failed",
                "The database rejected the query due to a programming error.",
                ProblemTypes.InternalError,
                instance,
                httpContext);
            return true;
        }

        if (ex is TimeoutException)
        {
            result = CreateProblemResult(
                StatusCodes.Status503ServiceUnavailable,
                "Request Timeout",
                "An operation timed out. The request may succeed on retry.",
                ProblemTypes.DatabaseTimeout,
                instance,
                httpContext);
            return true;
        }

        // Network-layer and Azure throttling codes that SqlTransientDetector already classifies for Polly retries
        // but that can still surface at the HTTP boundary when the open/operation budget is exhausted.

        if (SqlTransientDetector.IsTransient(ex))
        {
            result = CreateProblemResult(
                StatusCodes.Status503ServiceUnavailable,
                "Database Timeout",
                "The database query timed out or hit a transient fault. The request may succeed on retry.",
                ProblemTypes.DatabaseTimeout,
                instance,
                httpContext);
            return true;
        }

        if (ex is not DbException)
            return false;

        result = CreateProblemResult(
            StatusCodes.Status503ServiceUnavailable,
            "Database Unavailable",
            "The database is currently unreachable. The request may succeed on retry.",
            ProblemTypes.DatabaseUnavailable,
            instance,
            httpContext);

        return true;
    }

    /// <summary>
    ///     Walks <see cref="Exception.InnerException" /> chain for a <see cref="SqlException" /> with the given
    ///     <see cref="SqlException.Number" />.
    /// </summary>
    private static SqlException? TryFindSqlExceptionWithNumber(Exception ex, int number)
    {
        for (Exception? e = ex; e is not null; e = e.InnerException)

            if (e is SqlException sql && sql.Number == number)
                return sql;

        return null;
    }

    /// <summary>
    ///     SQL Server syntax and programming faults that must not be surfaced as retryable 503 outages.
    /// </summary>
    private static SqlException? TryFindSqlProgrammingFault(Exception ex)
    {
        for (Exception? e = ex; e is not null; e = e.InnerException)
        {
            if (e is not SqlException sql)
                continue;

            if (IsSqlProgrammingFaultNumber(sql.Number))
                return sql;
        }

        return null;
    }

    private static bool IsSqlProgrammingFaultNumber(int number) =>
        // 8120 = column invalid in select list (missing from GROUP BY / aggregate) — deterministic query bug, not outage.
        number is 102 or 156 or 207 or 208 or 547 or 2812 or 319 or 4104 or 8120;
}
