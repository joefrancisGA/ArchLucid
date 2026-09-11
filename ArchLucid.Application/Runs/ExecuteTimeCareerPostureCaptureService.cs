using ArchLucid.Application.Common;
using ArchLucid.Contracts.User;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.UserPreferences;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs;

/// <inheritdoc cref="IExecuteTimeCareerPostureCaptureService" />
public sealed class ExecuteTimeCareerPostureCaptureService(
    IRunRepository runRepository,
    IScopeContextProvider scopeContextProvider,
    IWorkingCareerRehearsalDoorReader doorReader,
    IActorContext actorContext) : IExecuteTimeCareerPostureCaptureService
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IWorkingCareerRehearsalDoorReader _doorReader =
        doorReader ?? throw new ArgumentNullException(nameof(doorReader));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    /// <inheritdoc />
    public async Task TryCaptureAndPersistAsync(string runId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (!TryParseRunGuid(runId, out Guid runGuid))
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? header = await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken).ConfigureAwait(false);

        if (header is null)
            return;

        if (header.GoldenManifestId.HasValue)
            return;

        if (header.ExecutePostureCapturedUtc.HasValue)
            return;

        string actorId = _actorContext.GetActorId();
        string? stored = await _doorReader.TryGetStoredDoorAsync(actorId, cancellationToken).ConfigureAwait(false);

        header.WorkingCareerRehearsalDoor = WorkingCareerRehearsalDoorValues.ParseOrDefault(stored);
        header.ExecutePostureCapturedUtc = TimeProvider.System.UtcNowDateTime();
        await _runRepository.UpdateAsync(header, cancellationToken).ConfigureAwait(false);
    }

    private static bool TryParseRunGuid(string runId, out Guid runGuid) =>
        Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
}
