output "namespace_id" {
  value       = azurerm_servicebus_namespace.integration.id
  description = "Resource id of the Service Bus namespace."
}

output "namespace_fqdn" {
  value       = "${azurerm_servicebus_namespace.integration.name}.servicebus.windows.net"
  description = "FQDN used for IntegrationEvents:ServiceBusFullyQualifiedNamespace."
}

output "topic_name" {
  value       = azurerm_servicebus_topic.integration_events.name
  description = "Topic name for IntegrationEvents:QueueOrTopicName when publishing to a topic."
}

output "worker_subscription_name" {
  value       = azurerm_servicebus_subscription.worker.name
  description = "Subscription name for IntegrationEvents:SubscriptionName on workers."
}

output "primary_connection_string" {
  value       = azurerm_servicebus_namespace.integration.default_primary_connection_string
  sensitive   = true
  description = "Primary root connection string (bootstrap / non–managed-identity only)."
}
