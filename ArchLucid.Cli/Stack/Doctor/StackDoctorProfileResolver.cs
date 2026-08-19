using ArchLucid.Cli.Stack;

namespace ArchLucid.Cli.Stack.Doctor;

/// <summary>Infers doctor profile from <c>archlucid.stack.yaml</c> when <c>--profile</c> is omitted (TB-658).</summary>
internal static class StackDoctorProfileResolver
{
    internal static bool TryResolveFromAnswersFile(string answersPath, out string profile, out string? error)
    {
        profile = string.Empty;
        error = null;

        try
        {
            ArchlucidStackDocument document = ArchlucidStackDocumentParser.ParseFile(answersPath);
            string environment = document.Azure.Environment.Trim();

            if (string.IsNullOrWhiteSpace(environment))
            {
                error = "azure.environment is empty in stack answers file.";

                return false;
            }

            profile = MapStackEnvironment(environment);

            return true;
        }
        catch (Exception ex) when (ex is FileNotFoundException or InvalidOperationException or System.Text.Json.JsonException)
        {
            error = ex.Message;

            return false;
        }
    }

    internal static string MapStackEnvironment(string environment) =>
        environment.Trim().ToLowerInvariant() switch
        {
            "production" => StackDoctorProfile.ProductionLike,
            "staging" => StackDoctorProfile.StagingRealLlm,
            _ => StackDoctorProfile.FirstPilotMinimum,
        };
}
