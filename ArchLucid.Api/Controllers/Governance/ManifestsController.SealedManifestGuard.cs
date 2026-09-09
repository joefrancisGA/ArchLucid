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
}
