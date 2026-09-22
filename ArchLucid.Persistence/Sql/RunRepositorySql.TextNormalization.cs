namespace ArchLucid.Persistence.Sql;

internal static partial class RunRepositorySql
{
    internal const string CollapsedUpperArchitectureRequestId = """
                                                                UPPER(LTRIM(RTRIM((
                                                                    SELECT STRING_AGG(LTRIM(RTRIM(ss.value)), N' ')
                                                                    FROM STRING_SPLIT(LTRIM(RTRIM(ArchitectureRequestId)), N' ') AS ss
                                                                    WHERE LTRIM(RTRIM(ss.value)) <> N''
                                                                ))))
                                                                """;

    internal const string CollapsedUpperArchitectureRequestsRequestId = """
                                                                      UPPER(LTRIM(RTRIM((
                                                                          SELECT STRING_AGG(LTRIM(RTRIM(ss.value)), N' ')
                                                                          FROM STRING_SPLIT(LTRIM(RTRIM(ar.RequestId)), N' ') AS ss
                                                                          WHERE LTRIM(RTRIM(ss.value)) <> N''
                                                                      ))))
                                                                      """;

    internal const string CollapsedUpperRunsArchitectureRequestId = """
                                                                  UPPER(LTRIM(RTRIM((
                                                                      SELECT STRING_AGG(LTRIM(RTRIM(ss.value)), N' ')
                                                                      FROM STRING_SPLIT(LTRIM(RTRIM(r.ArchitectureRequestId)), N' ') AS ss
                                                                      WHERE LTRIM(RTRIM(ss.value)) <> N''
                                                                  ))))
                                                                  """;

    internal const string CollapsedUpperProjectId = """
                                                    UPPER(LTRIM(RTRIM((
                                                        SELECT STRING_AGG(LTRIM(RTRIM(ss.value)), N' ')
                                                        FROM STRING_SPLIT(LTRIM(RTRIM(ProjectId)), N' ') AS ss
                                                        WHERE LTRIM(RTRIM(ss.value)) <> N''
                                                    ))))
                                                    """;

    internal const string CollapsedUpperRunsProjectId = """
                                                      UPPER(LTRIM(RTRIM((
                                                          SELECT STRING_AGG(LTRIM(RTRIM(ss.value)), N' ')
                                                          FROM STRING_SPLIT(LTRIM(RTRIM(r.ProjectId)), N' ') AS ss
                                                          WHERE LTRIM(RTRIM(ss.value)) <> N''
                                                      ))))
                                                      """;
}
