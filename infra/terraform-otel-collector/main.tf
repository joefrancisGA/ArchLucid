# ----------------------------------------------------------------------------
# infra/terraform-otel-collector/main.tf
#
# Status: SCAFFOLD — see README.md "TODO before first apply".
#
# This file intentionally contains NO `resource` blocks today. It exists so:
#   1. `terraform validate` succeeds in the new stack (variables/outputs only).
#   2. The deployment shape is captured in comments and survives review/handoff
#      before any Azure resource is provisioned.
#
# When ready to materialize, replace the comment block below with:
#   - azurerm_container_app (collector image + config secret + ingress)
#   - azurerm_container_app_secret (otel-collector-config.yaml)
#   - azurerm_monitor_diagnostic_setting (collector container logs)
#   - moved blocks if you ever rename the resources.
# ----------------------------------------------------------------------------

# Sketch of the collector config (to be moved into a dedicated file or rendered template):
#
# receivers:
#   otlp:
#     protocols:
#       grpc:
#       http:
#
# processors:
#   tail_sampling:
#     decision_wait: 10s
#     num_traces: 50000
#     expected_new_traces_per_sec: 100
#     policies:
#       - name: errors-always
#         type: status_code
#         status_code:
#           status_codes: [ERROR]
#       - name: slow-roots-always
#         type: latency
#         latency:
#           threshold_ms: ${var.tail_sampling_min_root_duration_ms}
#       - name: archlucid-authority-always
#         type: string_attribute
#         string_attribute:
#           key: otel.library.name
#           values: ${jsonencode(var.tail_sampling_always_keep_activity_sources)}
#       - name: head-based-fallback
#         type: probabilistic
#         probabilistic:
#           sampling_percentage: ${var.tail_sampling_default_ratio * 100}
#
# exporters:
#   azuremonitor:
#     connection_string: ${var.application_insights_connection_string}
#
# service:
#   pipelines:
#     traces:
#       receivers: [otlp]
#       processors: [tail_sampling]
#       exporters: [azuremonitor]
