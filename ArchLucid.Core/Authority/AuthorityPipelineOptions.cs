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

    /// <summary>
    ///     When <see langword="true" /> (default), abort the authority pipeline before decisioning if the findings
    ///     snapshot is only <see cref="ArchLucid.Contracts.Findings.FindingsSnapshotGenerationStatus.PartiallyComplete" />
    ///     (some finding engines failed). When <see langword="false" />, decisioning proceeds with available findings
    ///     and operators rely on <see cref="ArchLucid.Decisioning.Models.FindingsSnapshot.EngineFailures" /> telemetry.
    /// </summary>
    public bool HaltOnPartialFindings
    {
        get;
        set;
    } = true;

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
}
