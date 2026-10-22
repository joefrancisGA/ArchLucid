using Dapper;

namespace ArchLucid.Persistence.Sql;

internal readonly record struct SqlChunkedBatchCommand(string CommandText, DynamicParameters Parameters);
