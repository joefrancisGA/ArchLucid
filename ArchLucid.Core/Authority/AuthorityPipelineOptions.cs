namespace ArchLucid.Core.Authority;

/// <summary>
///     Time bounds for synchronous authority pipeline execution (or queued completion) after the run row is persisted.
/// </summary>
public sealed class AuthorityPipelineOptions
{
    public const string SectionName = "AuthorityPipeline";

    /// <summary>
    ///     Cancels the pipeline token after this duration. Use <see cref="TimeSpan.Zero" /> to disable (no timeout).
    /// </summary>
    public TimeSpan PipelineTimeout
    {
        get;
        set;
    } = TimeSpan.FromMinutes(5);

    /// <summary>When <see langword="true" />, abort the authority pipeline before decisioning if the findings
    ///     snapshot is only <see cref="ArchLucid.Contracts.Findings.FindingsSnapshotGenerationStatus.PartiallyComplete" />
    ///     and contains a safety-critical engine failure (Security, Compliance). When <see langword="false" /> (default),
    ///     advisory engine failures degrade coverage but allow decisioning to proceed.</summary>
    public bool HaltOnPartialFindings
    {
        get;
        set;
    } = false;

    /// <summary>
    ///     Selects the orchestration substrate for authority pipeline runs in **non-SQL** hosts (InMemory, tests).
    ///     Defaults to <see cref="OrchestratorBackend.Legacy" /> so simulator paths keep the in-process adapter.
    ///     SQL production hosts register the Durable Task-backed orchestrator for the application orchestrator port
    ///     regardless of this flag; set <see cref="OrchestratorBackend.DurableTask" /> with
    ///     <c>ArchLucid:AuthorityPipeline:DurableTask:GrpcEndpoint</c> so DTF gRPC/client infrastructure still activates
    ///     (improvement #26 / release smoke).
    /// </summary>
    public OrchestratorBackend OrchestratorBackend
    {
        get;
        set;
    } = OrchestratorBackend.Legacy;

    /// <summary>
    ///     Per-tenant limits on concurrently executing authority pipeline heavy stages (graph/findings/decision/manifest).
    /// </summary>
    public AuthorityPipelineConcurrencyOptions Concurrency
    {
        get;
        set;
    } = new();
}
