namespace ArchLucid.Core.UserPreferences;

/// <summary>Reads the stored Working Career vs Rehearsal door for execute-time stamping (CG-019).</summary>
public interface IWorkingCareerRehearsalDoorReader
{
    /// <summary>Returns the stored door value, or null when unset.</summary>
    Task<string?> TryGetStoredDoorAsync(string userId, CancellationToken cancellationToken);
}
