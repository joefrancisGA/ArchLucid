using System.Text.Json.Serialization;

namespace ArchLucid.Cli;

public static partial class ArchLucidProjectScaffolder
{
    public sealed class ScaffoldOptions
    {
        public string ProjectName
        {
            get;
            set;
        } = "";

        public string? BaseDirectory
        {
            get;
            set;
        } = null;

        public bool OverwriteExistingFiles
        {
            get;
            set;
        } = false;

        public bool IncludeTerraformStubs
        {
            get;
            set;
        } = true;

        /// <summary>
        ///     When true, attempt to register the project in SQL Server (PROJECTS table).
        ///     Default false so scaffolding works without a database connection.
        /// </summary>
        public bool RegisterProject
        {
            get;
            set;
        } = false;

        /// <summary>
        ///     SQL Server connection string used when <see cref="RegisterProject" /> is true.
        ///     Must be set explicitly; there is no hardcoded default to avoid accidental production writes.
        ///     Example: "Server=localhost;Database=ArchLucid;Trusted_Connection=True;"
        /// </summary>
        public string? ConnectionString
        {
            get;
            set;
        } = null;
    }

    public sealed class ArchLucidCliConfig
    {
        [JsonPropertyName("schemaVersion")]
        public string SchemaVersion
        {
            get;
            set;
        } = "1.0";

        [JsonPropertyName("projectName")]
        public string ProjectName
        {
            get;
            set;
        } = "";

        [JsonPropertyName("apiUrl")]
        public string? ApiUrl
        {
            get;
            set;
        }

        /// <summary>Optional operator UI origin for CLI route-smoke and deep links (e.g. ship-gate Gate 5).</summary>
        [JsonPropertyName("uiUrl")]
        public string? UiUrl
        {
            get;
            set;
        }

        [JsonPropertyName("inputs")]
        public InputsSection Inputs
        {
            get;
            set;
        } = new();

        [JsonPropertyName("outputs")]
        public OutputsSection Outputs
        {
            get;
            set;
        } = new();

        /// <summary>Optional — when omitted, CLI skips plugin lock validation (no plugin directory required).</summary>
        [JsonPropertyName("plugins")]
        public PluginsSection? Plugins
        {
            get;
            set;
        }

        /// <summary>Optional — when omitted, Terraform path checks are skipped (treated as disabled).</summary>
        [JsonPropertyName("infra")]
        public InfraSection? Infra
        {
            get;
            set;
        }

        [JsonPropertyName("architecture")]
        public ArchitectureSection? Architecture
        {
            get;
            set;
        }

        [JsonPropertyName("httpResilience")]
        public CliHttpResilienceConfig? HttpResilience
        {
            get;
            set;
        }

        /// <summary>Optional — when set, CLI attaches X-Tenant-Id / X-Workspace-Id / X-Project-Id on API calls.</summary>
        [JsonPropertyName("scope")]
        public CliScopeSection? Scope
        {
            get;
            set;
        }
    }

    /// <summary>Tenant routing scope for CLI API calls (mirrors browser proxy scope headers).</summary>
    public sealed class CliScopeSection
    {
        [JsonPropertyName("tenantId")]
        public string? TenantId
        {
            get;
            set;
        }

        [JsonPropertyName("workspaceId")]
        public string? WorkspaceId
        {
            get;
            set;
        }

        [JsonPropertyName("projectId")]
        public string? ProjectId
        {
            get;
            set;
        }
    }

    /// <summary>Optional HTTP retry tuning for the CLI API client (<c>archlucid.json</c>).</summary>
    public sealed class CliHttpResilienceConfig
    {
        [JsonPropertyName("maxRetryAttempts")]
        public int? MaxRetryAttempts
        {
            get;
            set;
        }

        [JsonPropertyName("initialDelaySeconds")]
        public int? InitialDelaySeconds
        {
            get;
            set;
        }
    }

    public sealed class ArchitectureSection
    {
        [JsonPropertyName("environment")]
        public string? Environment
        {
            get;
            set;
        }

        [JsonPropertyName("cloudProvider")]
        public string? CloudProvider
        {
            get;
            set;
        }

        [JsonPropertyName("constraints")]
        public List<string>? Constraints
        {
            get;
            set;
        }

        [JsonPropertyName("requiredCapabilities")]
        public List<string>? RequiredCapabilities
        {
            get;
            set;
        }

        [JsonPropertyName("assumptions")]
        public List<string>? Assumptions
        {
            get;
            set;
        }

        [JsonPropertyName("priorManifestVersion")]
        public string? PriorManifestVersion
        {
            get;
            set;
        }
    }

    public sealed class InputsSection
    {
        [JsonPropertyName("brief")]
        public string Brief
        {
            get;
            set;
        } = "inputs/brief.md";
    }

    public sealed class OutputsSection
    {
        [JsonPropertyName("localCacheDir")]
        public string LocalCacheDir
        {
            get;
            set;
        } = "outputs";
    }

    public sealed class PluginsSection
    {
        [JsonPropertyName("lockFile")]
        public string LockFile
        {
            get;
            set;
        } = "plugins/plugin-lock.json";
    }

    public sealed class InfraSection
    {
        [JsonPropertyName("terraform")]
        public TerraformSection Terraform
        {
            get;
            set;
        } = new();
    }

    public sealed class TerraformSection
    {
        [JsonPropertyName("enabled")]
        public bool Enabled
        {
            get;
            set;
        }

        [JsonPropertyName("path")]
        public string Path
        {
            get;
            set;
        } = "infra/terraform";
    }
}
