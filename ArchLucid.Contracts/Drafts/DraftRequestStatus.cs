using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Drafts;

/// <summary>
///     Lifecycle state for a <see cref="DraftRequestDocument" /> (ADR 0048).
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum DraftRequestStatus
{
    /// <summary>Mutable — intent is being shaped through elicitation.</summary>
    Drafting,

    /// <summary>Admission gate passed; MUST-set must be answered before submit.</summary>
    Admitted,

    /// <summary>Submitted to the canonical run-create path; awaiting or completed run spawn.</summary>
    Submitted,

    /// <summary>A run was created from this draft via <c>POST /v1/architecture/request</c>.</summary>
    RunSpawned,

    /// <summary>Admission gate could not recover designable intent — redirect, not refuse (R6).</summary>
    Redirected,

    /// <summary>Terminal — user or operator abandoned the draft.</summary>
    Abandoned,
}
