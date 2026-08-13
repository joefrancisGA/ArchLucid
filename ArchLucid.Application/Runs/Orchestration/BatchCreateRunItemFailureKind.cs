namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>Why a single batch item did not produce a run. The HTTP layer maps these onto problem type codes.</summary>
public enum BatchCreateRunItemFailureKind
{
    /// <summary>The item created a run.</summary>
    None = 0,

    /// <summary>The submitted array contained a null element.</summary>
    NullItem = 1,

    /// <summary>The request collided with existing state (duplicate request id, concurrent create).</summary>
    Conflict = 2,

    /// <summary>The request was rejected before persistence (validation or content safety).</summary>
    InvalidRequest = 3
}
