using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

public static partial class ArchLucidLlmMeters
{
    /// <summary>Judge paths skipped fail-open when the isolated judge UTC-day token pool is exhausted (TB-190).</summary>
    public static readonly Counter<long> LlmJudgeBudgetExhaustedTotal =
        ArchLucidAppMeter.Instance.CreateCounter<long>(
            "archlucid_llm_judge_budget_exhausted_total",
            description: "LLM-as-judge or faithfulness judge skipped because the judge daily token sub-cap was exhausted.");

    /// <summary>Monthly USD reserve admission denied due to concurrent in-flight reservation ceiling (TB-977).</summary>
    public static readonly Counter<long> LlmMonthlyBudgetAdmissionBlockedTotal =
        ArchLucidAppMeter.Instance.CreateCounter<long>(
            "archlucid_llm_monthly_budget_admission_blocked_total",
            description: "Monthly USD reserve admission denied due to concurrent in-flight reservation ceiling (TB-977).");

    /// <summary>Monthly USD reserve/settle optimistic concurrency retries exhausted (TB-977).</summary>
    public static readonly Counter<long> LlmMonthlyBudgetOptimisticRetryExhaustedTotal =
        ArchLucidAppMeter.Instance.CreateCounter<long>(
            "archlucid_llm_monthly_budget_optimistic_retry_exhausted_total",
            description: "Monthly USD reserve/settle optimistic concurrency retries exhausted (TB-977).");

    /// <summary>Monthly USD reserve/settle used SQL-authoritative period remap (TB-977).</summary>
    public static readonly Counter<long> LlmMonthlyBudgetPeriodRemapTotal =
        ArchLucidAppMeter.Instance.CreateCounter<long>(
            "archlucid_llm_monthly_budget_period_remap_total",
            description: "Monthly USD reserve/settle observed caller/SQL UTC month mismatch (TB-977).");

    /// <summary>Expired monthly per-call reservation leases reclaimed by background worker (TB-976).</summary>
    public static readonly Counter<long> LlmMonthlyBudgetReservationReclaimedTotal =
        ArchLucidAppMeter.Instance.CreateCounter<long>(
            "archlucid_llm_monthly_budget_reservation_reclaimed_total",
            description: "Expired monthly per-call USD reservation leases reclaimed (TB-976).");

    /// <summary>
    ///     LLM completions rejected by per-tenant sliding-window token quota or UTC-day budget (pre-call, in
    ///     <c>LlmCompletionAccountingClient</c>).
    /// </summary>
    public static readonly Counter<long> LlmQuotaExceededTotal =
        ArchLucidAppMeter.Instance.CreateCounter<long>(
            "archlucid_llm_quota_exceeded_total",
            description: "LLM calls rejected by tenant token quota or daily budget before outbound completion.");

    /// <summary>Records a logical agent step spend-cap breach (TB-941).</summary>
    public static readonly Counter<long> AgentLogicalStepSpendCapHitsTotal =
        ArchLucidAppMeter.Instance.CreateCounter<long>(
            "archlucid_agent_logical_step_spend_cap_hits_total",
            description: "Per-(RunId, TaskId) billed completion attempt cap hits (labels: agent_type).");

    public static void RecordAgentLogicalStepSpendCapHit(string agentTypeLabel)
    {
        string label = string.IsNullOrWhiteSpace(agentTypeLabel) ? "unknown" : agentTypeLabel.Trim();
        TagList tags = [];
        tags.Add("agent_type", label);

        AgentLogicalStepSpendCapHitsTotal.Add(1, tags);
    }
}
