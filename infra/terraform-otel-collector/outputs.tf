# Placeholder outputs — return empty strings until main.tf provisions the
# Container App. Downstream stacks should treat empty strings as "collector
# not yet deployed" and fall back to direct Application Insights export.

output "otlp_grpc_endpoint" {
  description = "gRPC OTLP endpoint (host:port) for OTEL_EXPORTER_OTLP_ENDPOINT."
  value       = ""
}

output "otlp_http_endpoint" {
  description = "HTTP OTLP endpoint for environments that block gRPC egress."
  value       = ""
}
