namespace ArchLucid.Core.Agents;

/// <summary>Persisted agent model catalog row (TB-2103).</summary>
public sealed class AgentModelCatalogRow
{
    public required string AliasId
    {
        get;
        init;
    }

    public required string ProviderConnectionKind
    {
        get;
        init;
    }

    public string? DeploymentName
    {
        get;
        init;
    }

    public string? TierBinding
    {
        get;
        init;
    }

    public required IReadOnlyList<string> CapabilityTags
    {
        get;
        init;
    }

    public required IReadOnlyList<string> ApprovedTaskTypes
    {
        get;
        init;
    }

    public AgentModelStructuredOutputLevel StructuredOutputLevel
    {
        get;
        init;
    } = AgentModelStructuredOutputLevel.StrictJsonSchema;

    public AgentModelDataBoundaryKind DataBoundary
    {
        get;
        init;
    } = AgentModelDataBoundaryKind.AzureBoundary;

    /// <summary>
    ///     When <see cref="DataBoundary" /> is <see cref="AgentModelDataBoundaryKind.ExternalSubprocessor" />, must be
    ///     true before the alias is offered to tenants (TB-2109).
    /// </summary>
    public bool ExternalSubprocessorDisclosureComplete
    {
        get;
        init;
    }

    public AgentModelCatalogLifecycleStatus LifecycleStatus
    {
        get;
        init;
    } = AgentModelCatalogLifecycleStatus.Available;

    public DateTime? StructuredOutputProbeUtc
    {
        get;
        init;
    }

    public AgentModelTokenizerProfile TokenizerProfile
    {
        get;
        init;
    } = AgentModelTokenizerProfile.CharHeuristic;

    public int CharsPerToken
    {
        get;
        init;
    } = AgentModelCatalogTokenMath.DefaultCharsPerToken;

    /// <summary>Documented pre-flight estimate error margin for golden-case assertions (TB-2107).</summary>
    public decimal TokenizerErrorMarginPercent
    {
        get;
        init;
    } = AgentModelCatalogPricingDefaults.DefaultTokenizerErrorMarginPercent;

    public decimal? InputUsdPerMillionTokens
    {
        get;
        init;
    }

    public decimal? OutputUsdPerMillionTokens
    {
        get;
        init;
    }

    public decimal? ReasoningUsdPerMillionTokens
    {
        get;
        init;
    }

    public IReadOnlyList<AgentModelCatalogEvaluationRow> Evaluations
    {
        get;
        init;
    } = [];

    /// <summary>
    ///     Copies every persisted catalog column and replaces <see cref="Evaluations" />.
    ///     Catalog upsert writes the whole row, so a partial copy clears tokenizer settings and USD rates.
    /// </summary>
    public AgentModelCatalogRow WithEvaluations(IReadOnlyList<AgentModelCatalogEvaluationRow> evaluations)
    {
        ArgumentNullException.ThrowIfNull(evaluations);

        return new AgentModelCatalogRow
        {
            AliasId = AliasId,
            ProviderConnectionKind = ProviderConnectionKind,
            DeploymentName = DeploymentName,
            TierBinding = TierBinding,
            CapabilityTags = CapabilityTags,
            ApprovedTaskTypes = ApprovedTaskTypes,
            StructuredOutputLevel = StructuredOutputLevel,
            DataBoundary = DataBoundary,
            ExternalSubprocessorDisclosureComplete = ExternalSubprocessorDisclosureComplete,
            LifecycleStatus = LifecycleStatus,
            StructuredOutputProbeUtc = StructuredOutputProbeUtc,
            TokenizerProfile = TokenizerProfile,
            CharsPerToken = CharsPerToken,
            TokenizerErrorMarginPercent = TokenizerErrorMarginPercent,
            InputUsdPerMillionTokens = InputUsdPerMillionTokens,
            OutputUsdPerMillionTokens = OutputUsdPerMillionTokens,
            ReasoningUsdPerMillionTokens = ReasoningUsdPerMillionTokens,
            Evaluations = evaluations,
        };
    }
}

/// <summary>Per-task evaluation evidence attached to a catalog row (TB-2105).</summary>
public sealed class AgentModelCatalogEvaluationRow
{
    public required string TaskType
    {
        get;
        init;
    }

    public AgentModelEvaluationStateKind EvaluationState
    {
        get;
        init;
    } = AgentModelEvaluationStateKind.NotEvaluated;

    public string? EvidenceJson
    {
        get;
        init;
    }

    public DateTime? EvaluatedUtc
    {
        get;
        init;
    }
}
