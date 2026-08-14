using System.Text.Json.Serialization;

using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Contracts.Drafts;

/// <summary>
///     Mutable JSON payload stored on a draft row (ADR 0048 / ADR 0013 <c>schemaVersion</c>).
/// </summary>
public sealed class DraftRequestDocument
{
    /// <summary>Document schema version for additive evolution.</summary>
    [JsonPropertyName("schemaVersion")]
    public int SchemaVersion
    {
        get;
        set;
    } = DraftRequestDocumentSchema.CurrentVersion;

    /// <summary>Raw free-text intent supplied at draft creation.</summary>
    [JsonPropertyName("freeTextIntent")]
    public string FreeTextIntent
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Optional short system name projected into <c>ArchitectureRequest.SystemName</c>.</summary>
    [JsonPropertyName("systemName")]
    public string? SystemName
    {
        get;
        set;
    }

    /// <summary>
    ///     The non-inferable business outcome origin (R4).  When asserted by the user it is recorded
    ///     in <see cref="TransparencyTrail" /> as well.
    /// </summary>
    [JsonPropertyName("businessOutcome")]
    public string? BusinessOutcome
    {
        get;
        set;
    }

    /// <summary>Inferred-then-confirmed actor set (ADR 0049).</summary>
    [JsonPropertyName("actorSet")]
    public ActorSet ActorSet
    {
        get;
        set;
    } = new();

    /// <summary>Mandatory transparency trail accumulating asserted / inferred / skipped items (ADR 0050).</summary>
    [JsonPropertyName("transparencyTrail")]
    public TransparencyTrail TransparencyTrail
    {
        get;
        set;
    } = new();

    /// <summary>Answers keyed by <see cref="Governance.ElicitationQuestion.QuestionKey" />.</summary>
    [JsonPropertyName("questionAnswers")]
    public Dictionary<string, string> QuestionAnswers
    {
        get;
        set;
    } = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>
    ///     MUST-tier question keys still required before submit (populated at admission by ADR 0051 L0/L1 selection).
    /// </summary>
    [JsonPropertyName("requiredMustQuestionKeys")]
    public List<string> RequiredMustQuestionKeys
    {
        get;
        set;
    } = [];

    /// <summary>Optional conversation thread for pre-run intake (reuses <c>IConversationService</c>).</summary>
    [JsonPropertyName("conversationThreadId")]
    public Guid? ConversationThreadId
    {
        get;
        set;
    }

    /// <summary>Parent draft when this row is a what-if branch snapshot (R12 — reserved).</summary>
    [JsonPropertyName("parentDraftId")]
    public Guid? ParentDraftId
    {
        get;
        set;
    }

    /// <summary>
    ///     When true (default), submit projects <see cref="FocusedPilotModePolicyPacks.ReferenceToken" /> into
    ///     <c>ArchitectureRequest.PolicyReferences</c>.
    /// </summary>
    [JsonPropertyName("focusedPilotModeEnabled")]
    public bool? FocusedPilotModeEnabled
    {
        get;
        set;
    }

    /// <summary>
    ///     Homepage workflow intent copied to <see cref="Requests.ArchitectureRequest.WorkflowIntent" /> on submit.
    /// </summary>
    [JsonPropertyName("workflowIntent")]
    public string? WorkflowIntent
    {
        get;
        set;
    }

    /// <summary>Confirmable structured brief lists and quality notes (TB-2282).</summary>
    [JsonPropertyName("structuredBrief")]
    public ArchitectureDraftStructuredBrief StructuredBrief
    {
        get;
        set;
    } = new();
}
