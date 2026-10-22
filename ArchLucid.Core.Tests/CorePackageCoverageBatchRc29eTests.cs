using System.Diagnostics.Metrics;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Retrieval;
using ArchLucid.TestSupport.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Core.Tests;

/// <summary>RC29e package-coverage batch: pilot-mode, schema validation, OTP, audit, and outbox instrumentation.</summary>
[Collection("ArchLucidInstrumentation")]
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CorePackageCoverageBatchRc29eTests
{
    [Fact]
    public void AgentExecutionLlmCallAccumulator_accumulates_and_consumes_completion_counts()
    {
        AgentExecutionLlmCallAccumulator accumulator = new();

        accumulator.AddCompletions(0);
        accumulator.AddCompletions(2);
        accumulator.Consume().Should().Be(2);
        accumulator.Consume().Should().Be(0);
    }

    [Fact]
    public void BeginLlmCallsPerRunAccumulation_records_completion_for_active_scope()
    {
        AgentExecutionLlmCallAccumulator accumulator = new();

        using (ArchLucidInstrumentation.BeginLlmCallsPerRunAccumulation(accumulator))
        {
            ArchLucidInstrumentation.RecordLlmCompletionCallForCurrentRunBatch();
            ArchLucidInstrumentation.RecordLlmCompletionCallForCurrentRunBatch();
        }

        accumulator.Consume().Should().Be(2);
    }

    [Fact]
    public void RecordTryRealModePilot_and_finding_engine_counters_emit()
    {
        _ = ArchLucidInstrumentation.TryRealModeAttemptedTotal;
        _ = ArchLucidInstrumentation.TryRealModeSucceededTotal;
        _ = ArchLucidInstrumentation.TryRealModeFellBackToSimulatorTotal;
        _ = ArchLucidInstrumentation.FindingEngineFailuresTotal;
        _ = ArchLucidInstrumentation.FindingsEnginePartialFailureTotal;

        using LongCounterCapture capture = LongCounterCapture.Start(
            "archlucid.try.real_mode.attempted_total",
            "archlucid.try.real_mode.succeeded_total",
            "archlucid.try.real_mode.fellback_to_simulator_total",
            "archlucid_finding_engine_failures_total",
            "archlucid_findings_engine_partial_failure_total");

        ArchLucidInstrumentation.RecordTryRealModePilotAttempted();
        ArchLucidInstrumentation.RecordTryRealModePilotSucceeded();
        ArchLucidInstrumentation.RecordTryRealModePilotFellBackToSimulator();
        ArchLucidInstrumentation.RecordFindingEngineFailure("deterministic", "timeout");
        ArchLucidInstrumentation.RecordFindingsEnginePartialFailure();

        capture.LongMeasures.Should().Contain(m => m.Name == "archlucid.try.real_mode.attempted_total");
        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_finding_engine_failures_total"
            && m.Tags.Any(t => t.Key == "engine_type" && (string?)t.Value == "deterministic"));
        capture.LongMeasures.Should().Contain(m => m.Name == "archlucid_findings_engine_partial_failure_total");
    }

    [Fact]
    public void Record_agent_and_explanation_schema_validation_counters_emit_tagged_labels()
    {
        _ = ArchLucidInstrumentation.AgentResultSchemaValidationsTotal;
        _ = ArchLucidInstrumentation.AgentSchemaRemediationRetriesTotal;
        _ = ArchLucidInstrumentation.AgentSchemaRemediationCompletionsTotal;
        _ = ArchLucidInstrumentation.ExplanationSchemaValidationsTotal;
        _ = ArchLucidInstrumentation.ExplanationRetrySuccessTotal;

        using LongCounterCapture capture = LongCounterCapture.Start(
            "archlucid_agent_result_schema_validations_total",
            "archlucid.agent.schema_remediation_retries_total",
            "archlucid.agent.schema_remediation_completions_total",
            "archlucid_explanation_schema_validations_total",
            "archlucid_explanation_retry_success_total");

        ArchLucidInstrumentation.RecordAgentResultSchemaValidation("holistic-critic", "pass");
        ArchLucidInstrumentation.RecordAgentSchemaRemediationRetry("cost-estimator");
        ArchLucidInstrumentation.RecordAgentSchemaRemediationCompletion("cost-estimator", 2);
        ArchLucidInstrumentation.RecordExplanationSchemaValidation("finding-rationale", "fail");
        ArchLucidInstrumentation.RecordExplanationRetrySuccess("finding-rationale");

        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_agent_result_schema_validations_total"
            && m.Tags.Any(t => t.Key == "agent_type" && (string?)t.Value == "holistic-critic"));
        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_explanation_schema_validations_total"
            && m.Tags.Any(t => t.Key == "outcome" && (string?)t.Value == "fail"));
    }

    [Fact]
    public void Record_faithfulness_ratio_histograms_emit_clamped_values()
    {
        _ = ArchLucidInstrumentation.ExplanationFaithfulnessRatio;
        _ = ArchLucidInstrumentation.RetrievalFaithfulnessRatio;

        using DoubleCounterCapture capture = DoubleCounterCapture.Start(
            "archlucid_explanation_faithfulness_ratio",
            "archlucid_retrieval_faithfulness_ratio");

        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        IReadOnlyList<RetrievalHit> hits = [new RetrievalHit { CorpusKind = "TenantManifest", ChunkId = "c-1" }];

        ArchLucidInstrumentation.RecordExplanationFaithfulnessRatio(1.5);
        ArchLucidInstrumentation.RecordRetrievalFaithfulnessRatio(-0.2, tenantId, hits);

        capture.DoubleMeasures.Should().Contain(m =>
            m.Name == "archlucid_explanation_faithfulness_ratio" && m.Value == 1.0);
        capture.DoubleMeasures.Should().Contain(m =>
            m.Name == "archlucid_retrieval_faithfulness_ratio"
            && m.Value == 0.0
            && m.Tags.Any(t => t.Key == "corpus_source" && (string?)t.Value == "TenantManifest"));
    }

    [Fact]
    public void Record_email_otp_counters_emit_expected_instruments()
    {
        _ = ArchLucidInstrumentation.EmailOtpChallengeRequestedTotal;
        _ = ArchLucidInstrumentation.EmailOtpChallengeVerifiedTotal;
        _ = ArchLucidInstrumentation.EmailOtpDeliveryFailedTotal;
        _ = ArchLucidInstrumentation.EmailOtpRateLimitTriggeredTotal;

        using LongCounterCapture capture = LongCounterCapture.Start(
            "archlucid_email_otp_challenge_requested_total",
            "archlucid_email_otp_challenge_verified_total",
            "archlucid_email_otp_delivery_failed_total",
            "archlucid_email_otp_rate_limit_triggered_total");

        ArchLucidInstrumentation.RecordEmailOtpChallengeRequested("accepted");
        ArchLucidInstrumentation.RecordEmailOtpChallengeVerified("success");
        ArchLucidInstrumentation.RecordEmailOtpDeliveryFailed();
        ArchLucidInstrumentation.RecordEmailOtpRateLimitTriggered("ip");

        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_email_otp_challenge_requested_total"
            && m.Tags.Any(t => t.Key == "result" && (string?)t.Value == "accepted"));
        capture.LongMeasures.Should().Contain(m => m.Name == "archlucid_email_otp_delivery_failed_total");
    }

    [Fact]
    public void Record_audit_write_failure_and_orphan_counters_emit()
    {
        _ = ArchLucidInstrumentation.AuditWriteFailuresTotal;
        _ = ArchLucidInstrumentation.RequiredAuditWriteAbandonsTotal;
        _ = ArchLucidInstrumentation.RequiredAuditTrailOrphansDetectedTotal;

        using LongCounterCapture capture = LongCounterCapture.Start(
            "archlucid_audit_write_failures_total",
            "archlucid_required_audit_write_abandons_total",
            "archlucid_required_audit_trail_orphans_detected_total");

        ArchLucidInstrumentation.RecordAuditWriteFailure("AuthorityRunCommitted");
        ArchLucidInstrumentation.RecordRequiredAuditWriteAbandon("ManifestFinalized");
        ArchLucidInstrumentation.RecordRequiredAuditTrailOrphan("governance", 3);

        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_audit_write_failures_total"
            && m.Tags.Any(t => t.Key == "event_type" && (string?)t.Value == "AuthorityRunCommitted"));
        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_required_audit_trail_orphans_detected_total" && m.Value == 3);
    }

    [Fact]
    public void Record_post_commit_projection_outbox_counters_emit()
    {
        _ = ArchLucidInstrumentation.PostCommitProjectionOutboxProcessedSuccessTotal;
        _ = ArchLucidInstrumentation.PostCommitProjectionOutboxRetryScheduledTotal;
        _ = ArchLucidInstrumentation.PostCommitProjectionOutboxDeadLetteredTotal;

        using LongCounterCapture capture = LongCounterCapture.Start(
            "archlucid_post_commit_projection_outbox_processed_success_total",
            "archlucid_post_commit_projection_outbox_retry_scheduled_total",
            "archlucid_post_commit_projection_outbox_dead_lettered_total");

        ArchLucidInstrumentation.RecordPostCommitProjectionOutboxProcessedSuccess();
        ArchLucidInstrumentation.RecordPostCommitProjectionOutboxRetryScheduled();
        ArchLucidInstrumentation.RecordPostCommitProjectionOutboxDeadLettered();

        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_post_commit_projection_outbox_processed_success_total");
        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_post_commit_projection_outbox_dead_lettered_total");
    }

    [Fact]
    public void Record_llm_batch_completion_and_retrieval_corpus_startup_counters_emit()
    {
        _ = ArchLucidInstrumentation.LlmBatchJobsCompletedTotal;
        _ = ArchLucidInstrumentation.RetrievalCorpusStartupIndexerFailureTotal;

        using LongCounterCapture capture = LongCounterCapture.Start(
            "archlucid_llm_batch_jobs_completed_total",
            "archlucid_retrieval_corpus_startup_indexer_failure_total");

        ArchLucidInstrumentation.RecordLlmBatchCompletionRun(4, 120, 48, 0.25);
        ArchLucidInstrumentation.RecordRetrievalCorpusStartupIndexerFailure("TenantManifest");

        capture.LongMeasures.Should().Contain(m => m.Name == "archlucid_llm_batch_jobs_completed_total");
        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_retrieval_corpus_startup_indexer_failure_total"
            && m.Tags.Any(t => t.Key == "corpus_kind" && (string?)t.Value == "TenantManifest"));
    }

    [Fact]
    public void Record_first_tenant_funnel_event_and_startup_config_warning_emit()
    {
        _ = ArchLucidInstrumentation.FirstTenantFunnelEventsTotal;
        _ = ArchLucidInstrumentation.StartupConfigWarningsTotal;

        using LongCounterCapture capture = LongCounterCapture.Start(
            "archlucid_first_tenant_funnel_events_total",
            "archlucid_startup_config_warnings_total");

        ArchLucidInstrumentation.RecordFirstTenantFunnelEvent("signup", recordPerTenant: true, tenantIdNormalized: "tenant-1");
        ArchLucidInstrumentation.RecordStartupConfigWarning("LlmWallet");

        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_first_tenant_funnel_events_total"
            && m.Tags.Any(t => t.Key == "tenant_id" && (string?)t.Value == "tenant-1"));
        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_startup_config_warnings_total"
            && m.Tags.Any(t => t.Key == "rule_name" && (string?)t.Value == "LlmWallet"));
    }

    [Fact]
    public void Record_llm_prompt_redaction_counters_emit_tagged_counts()
    {
        _ = ArchLucidInstrumentation.LlmPromptRedactionsTotal;
        _ = ArchLucidInstrumentation.LlmPromptRedactionSkippedTotal;

        using LongCounterCapture capture = LongCounterCapture.Start(
            "archlucid_llm_prompt_redactions_total",
            "archlucid_llm_prompt_redaction_skipped_total");

        ArchLucidInstrumentation.RecordLlmPromptRedactions("email", 2);
        ArchLucidInstrumentation.RecordLlmPromptRedactionSkipped(1);

        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_llm_prompt_redactions_total"
            && m.Tags.Any(t => t.Key == "category" && (string?)t.Value == "email"));
        capture.LongMeasures.Should().Contain(m =>
            m.Name == "archlucid_llm_prompt_redaction_skipped_total" && m.Value == 1);
    }

    private sealed class LongCounterCapture : IDisposable
    {
        private readonly List<LongMeasurementRecord> _longMeasures = [];
        private readonly MeterListener _listener = new();

        private LongCounterCapture(IEnumerable<string> instrumentNames)
        {
            HashSet<string> names = instrumentNames.ToHashSet(StringComparer.Ordinal);

            _listener.InstrumentPublished = (instrument, meterListener) =>
            {
                if (instrument.Meter.Name != ArchLucidInstrumentationTestSupport.MeterName)
                    return;

                if (names.Contains(instrument.Name))
                    meterListener.EnableMeasurementEvents(instrument);
            };
            _listener.SetMeasurementEventCallback<long>(OnLong);
            _listener.Start();
        }

        public IReadOnlyList<LongMeasurementRecord> LongMeasures => _longMeasures;

        public void Dispose() => _listener.Dispose();

        public static LongCounterCapture Start(params string[] instrumentNames) => new(instrumentNames);

        private void OnLong(
            Instrument instrument,
            long measurement,
            ReadOnlySpan<KeyValuePair<string, object?>> tags,
            object? state)
        {
            _ = state;
            List<KeyValuePair<string, object?>> tagList = [];

            foreach (KeyValuePair<string, object?> tag in tags)
                tagList.Add(tag);

            _longMeasures.Add(new LongMeasurementRecord(instrument.Name, measurement, tagList));
        }
    }

    private sealed class DoubleCounterCapture : IDisposable
    {
        private readonly List<DoubleMeasurementRecord> _doubleMeasures = [];
        private readonly MeterListener _listener = new();

        private DoubleCounterCapture(IEnumerable<string> instrumentNames)
        {
            HashSet<string> names = instrumentNames.ToHashSet(StringComparer.Ordinal);

            _listener.InstrumentPublished = (instrument, meterListener) =>
            {
                if (instrument.Meter.Name != ArchLucidInstrumentationTestSupport.MeterName)
                    return;

                if (names.Contains(instrument.Name))
                    meterListener.EnableMeasurementEvents(instrument);
            };
            _listener.SetMeasurementEventCallback<double>(OnDouble);
            _listener.Start();
        }

        public IReadOnlyList<DoubleMeasurementRecord> DoubleMeasures => _doubleMeasures;

        public void Dispose() => _listener.Dispose();

        public static DoubleCounterCapture Start(params string[] instrumentNames) => new(instrumentNames);

        private void OnDouble(
            Instrument instrument,
            double measurement,
            ReadOnlySpan<KeyValuePair<string, object?>> tags,
            object? state)
        {
            _ = state;
            List<KeyValuePair<string, object?>> tagList = [];

            foreach (KeyValuePair<string, object?> tag in tags)
                tagList.Add(tag);

            _doubleMeasures.Add(new DoubleMeasurementRecord(instrument.Name, measurement, tagList));
        }
    }

    private sealed record LongMeasurementRecord(
        string Name,
        long Value,
        List<KeyValuePair<string, object?>> Tags);

    private sealed record DoubleMeasurementRecord(
        string Name,
        double Value,
        List<KeyValuePair<string, object?>> Tags);
}
