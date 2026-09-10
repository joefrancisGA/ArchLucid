using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class ManifestsController
{
    /// <summary>
    ///     Wave-62 suggestion 738: manifest summary reads fail-closed via
    ///     <c>ManifestGoldenReadSealedManifestHashGuard</c> inside <see cref="GetManifestInScopeAsync" />.
    /// </summary>
    private static class ManifestSummarySealedManifestReadGuard
    {
        public const string GuardTypeName = "ManifestGoldenReadSealedManifestHashGuard";
    }

    /// <summary>
    ///     Maps golden-manifest read <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapGoldenManifestReadSealedManifestConflict(ConflictException ex) =>
        GoldenManifestReadConflictProblem(ex);

    private IActionResult GoldenManifestReadConflictProblem(ConflictException ex)
    {
        string problemType = ex.Message.Contains("hash", StringComparison.OrdinalIgnoreCase)
            ? ProblemTypes.DecisionReceiptSealedHashMismatch
            : ProblemTypes.Conflict;

        return this.ConflictProblem(ex.Message, problemType);
    }
}
