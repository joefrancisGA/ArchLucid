-- TB-932 — JSON LOB size distribution (evidence gate before blob offload)
-- Safe: read-only aggregates. DATALENGTH is bytes for NVARCHAR (UTF-16 storage).
-- Thresholds: sub-MB = typically Won't-do; multi-MB p95 / material % >1MB = proceed to design.

SET NOCOUNT ON;

DECLARE @OneMb int = 1024 * 1024;

;WITH Sources AS (
    SELECT N'dbo.AgentResults.ResultJson' AS SourceName, DATALENGTH(ResultJson) AS ByteLen
    FROM dbo.AgentResults WITH (NOLOCK)
    UNION ALL
    SELECT N'dbo.AgentExecutionTraces.TraceJson', DATALENGTH(TraceJson)
    FROM dbo.AgentExecutionTraces WITH (NOLOCK)
    UNION ALL
    SELECT N'dbo.FindingRecords.PayloadJson', DATALENGTH(PayloadJson)
    FROM dbo.FindingRecords WITH (NOLOCK)
    WHERE PayloadJson IS NOT NULL
    UNION ALL
    SELECT N'dbo.FindingsSnapshots.FindingsJson', DATALENGTH(FindingsJson)
    FROM dbo.FindingsSnapshots WITH (NOLOCK)
    UNION ALL
    SELECT N'dbo.ComparisonRecords.PayloadJson', DATALENGTH(PayloadJson)
    FROM dbo.ComparisonRecords WITH (NOLOCK)
)
SELECT
    SourceName,
    COUNT_BIG(*) AS RowCnt,
    MIN(ByteLen) AS MinBytes,
    MAX(ByteLen) AS MaxBytes,
    AVG(CAST(ByteLen AS bigint)) AS AvgBytes,
    SUM(CASE WHEN ByteLen >= @OneMb THEN 1 ELSE 0 END) AS RowsAtLeast1MB,
    SUM(CASE WHEN ByteLen >= 2 * @OneMb THEN 1 ELSE 0 END) AS RowsAtLeast2MB,
    SUM(CASE WHEN ByteLen >= 4 * @OneMb THEN 1 ELSE 0 END) AS RowsAtLeast4MB,
    CAST(100.0 * SUM(CASE WHEN ByteLen >= @OneMb THEN 1 ELSE 0 END) / NULLIF(COUNT_BIG(*), 0) AS decimal(9, 2)) AS PctAtLeast1MB
FROM Sources
GROUP BY SourceName
ORDER BY SourceName;

-- Approximate percentiles via NTILE buckets (good enough for go/no-go; not a stats engine).
;WITH Sized AS (
    SELECT N'dbo.AgentResults.ResultJson' AS SourceName, DATALENGTH(ResultJson) AS ByteLen
    FROM dbo.AgentResults WITH (NOLOCK)
    UNION ALL
    SELECT N'dbo.AgentExecutionTraces.TraceJson', DATALENGTH(TraceJson)
    FROM dbo.AgentExecutionTraces WITH (NOLOCK)
    UNION ALL
    SELECT N'dbo.FindingRecords.PayloadJson', DATALENGTH(PayloadJson)
    FROM dbo.FindingRecords WITH (NOLOCK)
    WHERE PayloadJson IS NOT NULL
    UNION ALL
    SELECT N'dbo.FindingsSnapshots.FindingsJson', DATALENGTH(FindingsJson)
    FROM dbo.FindingsSnapshots WITH (NOLOCK)
    UNION ALL
    SELECT N'dbo.ComparisonRecords.PayloadJson', DATALENGTH(PayloadJson)
    FROM dbo.ComparisonRecords WITH (NOLOCK)
),
Ranked AS (
    SELECT
        SourceName,
        ByteLen,
        NTILE(100) OVER (PARTITION BY SourceName ORDER BY ByteLen) AS Pctile
    FROM Sized
)
SELECT
    SourceName,
    MAX(CASE WHEN Pctile = 50 THEN ByteLen END) AS ApproxP50Bytes,
    MAX(CASE WHEN Pctile = 95 THEN ByteLen END) AS ApproxP95Bytes,
    MAX(CASE WHEN Pctile = 99 THEN ByteLen END) AS ApproxP99Bytes
FROM Ranked
GROUP BY SourceName
ORDER BY SourceName;
