using System.Data;
using System.Text;
using System.Text.Json;

using Microsoft.Data.SqlClient;


/*________________________________________
2) Folder layout created by archlucid new
    <projectName>/
archlucid.json
    inputs/
brief.md
    outputs/
.gitkeep
    plugins/
plugin-lock.json
    infra/
terraform/
main.tf
variables.tf
docs/
README.md
    What each file means
•	archlucid.json: the single source of truth for project configuration.
•	inputs/brief.md: the "one thing you can always run."
•	outputs/: optional local cache of output artifacts (not authoritative).
    •	plugins/plugin-lock.json: pinned plugin images + versions + endpoints.
•	infra/terraform/: optional; stubbed initially.
*/


namespace ArchLucid.Cli;

public static partial class ArchLucidProjectScaffolder
{
    /// <summary>Primary CLI manifest file name in each scaffolded project.</summary>
    public const string CliManifestFileName = "archlucid.json";

    /// <summary>Shared options for <see cref="CliManifestFileName" /> read/write (CA1869: single cached instance).</summary>
    private static readonly JsonSerializerOptions SJsonManifest = new()
    {
        WriteIndented = true, PropertyNameCaseInsensitive = true, ReadCommentHandling = JsonCommentHandling.Skip, AllowTrailingCommas = true
    };

    public static string CreateProject(ScaffoldOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);
        if (string.IsNullOrWhiteSpace(options.ProjectName))
            throw new ArgumentException("ProjectName is required. It cannot be null, empty, or whitespace.",
                nameof(options));

        Console.WriteLine("Creating Project " + options.ProjectName);

        string baseDir = string.IsNullOrWhiteSpace(options.BaseDirectory)
            ? Directory.GetCurrentDirectory()
            : options.BaseDirectory!;

        string projectRoot = Path.Combine(baseDir, options.ProjectName);

        // Create directories
        CreateDirectory(projectRoot);
        CreateDirectory(Path.Combine(projectRoot, "inputs"));
        CreateDirectory(Path.Combine(projectRoot, "outputs"));
        CreateDirectory(Path.Combine(projectRoot, "plugins"));
        CreateDirectory(Path.Combine(projectRoot, "infra", "terraform"));
        CreateDirectory(Path.Combine(projectRoot, "docs"));

        // Write files
        WriteFile(Path.Combine(projectRoot, CliManifestFileName), BuildArchLucidJson(options.ProjectName),
            options.OverwriteExistingFiles);
        WriteFile(Path.Combine(projectRoot, "inputs", "brief.md"), BuildBriefMd(options.ProjectName),
            options.OverwriteExistingFiles);
        WriteFile(Path.Combine(projectRoot, "outputs", ".gitkeep"), "", options.OverwriteExistingFiles);
        WriteFile(Path.Combine(projectRoot, "plugins", "plugin-lock.json"), BuildPluginLockJson(),
            options.OverwriteExistingFiles);

        if (options.IncludeTerraformStubs)
        {
            WriteFile(Path.Combine(projectRoot, "infra", "terraform", "main.tf"), BuildTerraformMainTf(),
                options.OverwriteExistingFiles);
            WriteFile(Path.Combine(projectRoot, "infra", "terraform", "variables.tf"), BuildTerraformVariablesTf(),
                options.OverwriteExistingFiles);
        }

        WriteFile(Path.Combine(projectRoot, "docs", "README.md"),
            BuildDocsReadme(options.ProjectName), options.OverwriteExistingFiles);

        if (options.RegisterProject)
        {
            if (string.IsNullOrWhiteSpace(options.ConnectionString))

                throw new InvalidOperationException(
                    "ScaffoldOptions.ConnectionString must be set when RegisterProject is true. " +
                    "Set it explicitly; there is no hardcoded default connection string.");

            const string sqlQuery =
                "INSERT INTO PROJECTS (ProjectName, BaseDirectory, OverwriteExistingFiles, IncludeTerraformStubs) " +
                "VALUES (@ProjectName, @BaseDirectory, @OverwriteExistingFiles, @IncludeTerraformStubs)";

            try
            {
                using SqlConnection connection = new(options.ConnectionString);
                connection.Open();
                Console.WriteLine("Connection successful.");
                using SqlCommand command = new(sqlQuery, connection);
                command.Parameters.Add("@ProjectName", SqlDbType.NVarChar, 0).Value = options.ProjectName;
                command.Parameters.Add("@BaseDirectory", SqlDbType.NVarChar, 0).Value =
                    options.BaseDirectory ?? (object)DBNull.Value;
                command.Parameters.Add("@OverwriteExistingFiles", SqlDbType.Bit, 0).Value =
                    options.OverwriteExistingFiles;
                command.Parameters.Add("@IncludeTerraformStubs", SqlDbType.Bit, 0).Value =
                    options.IncludeTerraformStubs;
                command.ExecuteNonQuery();
            }
            catch (SqlException ex)
            {
                Console.WriteLine("SQL Error: " + ex.Message);
            }
            catch (Exception ex)
            {
                Console.WriteLine("General Error: " + ex.Message);
            }
        }

        Console.WriteLine("Created Project " + options.ProjectName);
        return projectRoot;
    }

    private static void CreateDirectory(string path)
    {
        Directory.CreateDirectory(path);
    }

    private static void WriteFile(string path, string contents, bool overwrite)
    {
        if (File.Exists(path) && !overwrite)
            return;
        string? dir = Path.GetDirectoryName(path);
        if (!string.IsNullOrEmpty(dir))
            Directory.CreateDirectory(dir);
        File.WriteAllText(path, contents, new UTF8Encoding(false));
    }

    public static ArchLucidCliConfig LoadConfig(string? projectRoot)
    {
        string lucidPath = projectRoot is not null
            ? Path.Combine(projectRoot, CliManifestFileName)
            : CliManifestFileName;
        string legacyPath = projectRoot is not null
            ? Path.Combine(projectRoot, "archi" + "forge.json")
            : "archi" + "forge.json";

        string manifestPath;
        if (File.Exists(lucidPath))

            manifestPath = lucidPath;

        else if (File.Exists(legacyPath))
        {
            Console.Error.WriteLine(
                "[ArchLucid CLI] Using legacy manifest file name; rename '"
                + "archi"
                + "forge.json' to '"
                + CliManifestFileName
                + "'.");

            manifestPath = legacyPath;
        }
        else

            throw new FileNotFoundException(CliManifestFileName + " not found.", lucidPath);

        string json = File.ReadAllText(manifestPath, Encoding.UTF8);

        ArchLucidCliConfig? config;
        try
        {
            config = JsonSerializer.Deserialize<ArchLucidCliConfig>(json, SJsonManifest);
        }
        catch (JsonException ex)
        {
            throw new InvalidDataException($"Invalid JSON in {manifestPath}: {ex.Message}", ex);
        }

        if (config is null)
            throw new InvalidDataException($"Unable to parse {manifestPath} into ArchLucidCliConfig.");
        if (projectRoot is not null)
            ValidateConfigOrThrow(config, projectRoot);
        return config;
    }

    private static void ValidateConfigOrThrow(ArchLucidCliConfig config, string projectRoot)
    {
        if (string.IsNullOrWhiteSpace(config.SchemaVersion))
            throw new InvalidDataException(CliManifestFileName + ": schemaVersion is required.");
        if (string.IsNullOrWhiteSpace(config.ProjectName))
            throw new InvalidDataException(CliManifestFileName + ": projectName is required.");
        if (config.Inputs is null || string.IsNullOrWhiteSpace(config.Inputs.Brief))
            throw new InvalidDataException(CliManifestFileName + ": inputs.brief is required.");
        if (config.Outputs is null || string.IsNullOrWhiteSpace(config.Outputs.LocalCacheDir))
            throw new InvalidDataException(CliManifestFileName + ": outputs.localCacheDir is required.");

        EnsureRelativePathOrThrow(config.Inputs.Brief, "inputs.brief");
        EnsureRelativePathOrThrow(config.Outputs.LocalCacheDir, "outputs.localCacheDir");

        string briefPath = Path.Combine(projectRoot, config.Inputs.Brief);
        if (!File.Exists(briefPath))
            throw new FileNotFoundException($"Brief file not found at '{config.Inputs.Brief}'.", briefPath);

        if (config.Plugins is not null && !string.IsNullOrWhiteSpace(config.Plugins.LockFile))
        {
            EnsureRelativePathOrThrow(config.Plugins.LockFile, "plugins.lockFile");
            string lockPath = Path.Combine(projectRoot, config.Plugins.LockFile);

            if (!File.Exists(lockPath))
                throw new FileNotFoundException($"Plugin lock file not found at '{config.Plugins.LockFile}'.",
                    lockPath);
        }

        InfraSection infra = config.Infra ?? new InfraSection();
        TerraformSection tf = infra.Terraform;

        if (!tf.Enabled)
            return;

        if (string.IsNullOrWhiteSpace(tf.Path))
            throw new InvalidDataException(CliManifestFileName +
                                           ": infra.terraform.path is required when infra.terraform.enabled is true.");

        EnsureRelativePathOrThrow(tf.Path, "infra.terraform.path");
        string tfDir = Path.Combine(projectRoot, tf.Path);

        if (!Directory.Exists(tfDir))
            throw new DirectoryNotFoundException($"Terraform directory not found at '{tf.Path}'.");
    }

    private static void EnsureRelativePathOrThrow(string path, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(path))
            throw new InvalidDataException($"{CliManifestFileName}: {fieldName} is empty.");
        if (Path.IsPathRooted(path))
            throw new InvalidDataException(
                $"{CliManifestFileName}: {fieldName} must be a relative path, got rooted path '{path}'.");
        string normalized = path.Replace('\\', '/');
        if (normalized.StartsWith("../", StringComparison.Ordinal) || normalized.Contains("/../"))
            throw new InvalidDataException(
                $"{CliManifestFileName}: {fieldName} must not contain '..' segments ('{path}').");
    }
}
