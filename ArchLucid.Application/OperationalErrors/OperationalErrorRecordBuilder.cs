using System.Text.Json;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.OperationalErrors;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Application.OperationalErrors;

public static class OperationalErrorRecordBuilder
{
    public static OperationalErrorRecord Build(OperationalErrorCaptureRequest request, OperationalErrorOptions options)
    {
        Exception? exception = request.Exception;
        SqlException? sqlException = FindSqlException(exception);

        string message = request.MessageOverride ?? exception?.Message ?? "HTTP error";

        return new OperationalErrorRecord
        {
            Id = Guid.NewGuid(),
            OccurredUtc = TimeProvider.System.UtcNowDateTime(),
            Source = request.Source,
            Category = ResolveCategory(request.Category, sqlException),
            HttpStatusCode = request.HttpStatusCode,
            HttpMethod = TruncateNullable(LogSanitizer.Sanitize(request.HttpMethod), 16),
            RequestPath = TruncateNullable(LogSanitizer.Sanitize(request.RequestPath), 2048),
            ProblemType = TruncateNullable(LogSanitizer.Sanitize(request.ProblemType), 256),
            ExceptionType = TruncateNullable(LogSanitizer.Sanitize(exception?.GetType().FullName), 512),
            Message = TruncateRequired(LogSanitizer.Sanitize(message), options.MaxMessageLength),
            StackTrace = TruncateNullable(LogSanitizer.Sanitize(exception?.StackTrace), options.MaxStackTraceLength),
            SqlErrorNumber = sqlException?.Number,
            SqlErrorState = sqlException?.State,
            CorrelationId = TruncateNullable(LogSanitizer.Sanitize(request.CorrelationId), 128),
            OtelTraceId = TruncateNullable(LogSanitizer.Sanitize(request.OtelTraceId), 64),
            TenantId = request.TenantId,
            WorkspaceId = request.WorkspaceId,
            ProjectId = request.ProjectId,
            ActorUserId = TruncateNullable(LogSanitizer.Sanitize(request.ActorUserId), 256),
            DetailJson = BuildDetailJson(request, exception)
        };
    }

    private static string ResolveCategory(string requestedCategory, SqlException? sqlException)
    {
        if (sqlException is not null)
            return OperationalErrorCategory.DatabaseError;

        return requestedCategory;
    }

    private static string BuildDetailJson(OperationalErrorCaptureRequest request, Exception? exception)
    {
        Dictionary<string, string> detail = new(StringComparer.Ordinal);

        if (request.DetailFields is not null)

            foreach (KeyValuePair<string, string> pair in request.DetailFields)
                detail[pair.Key] = LogSanitizer.Sanitize(pair.Value) ?? string.Empty;

        List<string> innerSummaries = SummarizeInnerExceptions(exception);

        if (innerSummaries.Count > 0)
            detail["innerExceptions"] = string.Join(" | ", innerSummaries);

        return JsonSerializer.Serialize(detail);
    }

    private static List<string> SummarizeInnerExceptions(Exception? exception)
    {
        List<string> summaries = new();

        for (Exception? current = exception?.InnerException; current is not null; current = current.InnerException)
        {
            summaries.Add($"{current.GetType().Name}: {LogSanitizer.Sanitize(current.Message)}");

            if (summaries.Count >= 5)
                break;
        }

        return summaries;
    }

    private static SqlException? FindSqlException(Exception? exception)
    {
        for (Exception? current = exception; current is not null; current = current.InnerException)
        {
            if (current is SqlException sqlException)
                return sqlException;
        }

        return null;
    }

    private static string? TruncateNullable(string? value, int maxLength)
    {
        if (string.IsNullOrEmpty(value))
            return null;

        return value.Length <= maxLength ? value : value[..maxLength];
    }

    private static string TruncateRequired(string value, int maxLength)
    {
        if (string.IsNullOrEmpty(value))
            return string.Empty;

        return value.Length <= maxLength ? value : value[..maxLength];
    }
}
