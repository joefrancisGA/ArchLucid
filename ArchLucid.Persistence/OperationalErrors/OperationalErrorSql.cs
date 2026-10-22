namespace ArchLucid.Persistence.OperationalErrors;

internal static class OperationalErrorSql
{
    public const string Append = """
                                 INSERT INTO dbo.PlatformOperationalErrors (
                                     Id, OccurredUtc, Source, Category,
                                     HttpStatusCode, HttpMethod, RequestPath, ProblemType,
                                     ExceptionType, Message, StackTrace,
                                     SqlErrorNumber, SqlErrorState,
                                     CorrelationId, OtelTraceId,
                                     TenantId, WorkspaceId, ProjectId, ActorUserId,
                                     DetailJson
                                 )
                                 VALUES (
                                     @Id, @OccurredUtc, @Source, @Category,
                                     @HttpStatusCode, @HttpMethod, @RequestPath, @ProblemType,
                                     @ExceptionType, @Message, @StackTrace,
                                     @SqlErrorNumber, @SqlErrorState,
                                     @CorrelationId, @OtelTraceId,
                                     @TenantId, @WorkspaceId, @ProjectId, @ActorUserId,
                                     @DetailJson
                                 );
                                 """;

    public const string GetById = """
                                  SELECT
                                      Id, OccurredUtc, Source, Category,
                                      HttpStatusCode, HttpMethod, RequestPath, ProblemType,
                                      ExceptionType, Message, StackTrace,
                                      SqlErrorNumber, SqlErrorState,
                                      CorrelationId, OtelTraceId,
                                      TenantId, WorkspaceId, ProjectId, ActorUserId,
                                      DetailJson
                                  FROM dbo.PlatformOperationalErrors
                                  WHERE Id = @Id;
                                  """;

    public const string DeleteOlderThan = """
                                          DELETE TOP (@MaxRows)
                                          FROM dbo.PlatformOperationalErrors
                                          WHERE OccurredUtc < @CutoffUtc;
                                          """;
}
