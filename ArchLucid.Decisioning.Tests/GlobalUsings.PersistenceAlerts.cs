global using ArchLucid.Contracts.Alerts;
global using ArchLucid.Contracts.Alerts.Composite;
global using ArchLucid.Contracts.Alerts.Delivery;
global using ArchLucid.Contracts.Alerts.Simulation;
global using AlertRoutingMatcher = ArchLucid.Core.Alerts.Delivery.AlertRoutingMatcher;
global using AlertSeverityComparer = ArchLucid.Core.Alerts.Delivery.AlertSeverityComparer;

global using IAlertDeliveryAttemptRepository = ArchLucid.Core.Persistence.Ports.IAlertDeliveryAttemptRepository;
global using IAlertDeliveryChannel = ArchLucid.Core.Persistence.Ports.IAlertDeliveryChannel;
global using IAlertDeliveryDispatcher = ArchLucid.Core.Persistence.Ports.IAlertDeliveryDispatcher;
global using IAlertRecordRepository = ArchLucid.Core.Persistence.Ports.IAlertRecordRepository;
global using IAlertRoutingSubscriptionRepository = ArchLucid.Core.Persistence.Ports.IAlertRoutingSubscriptionRepository;
global using IAlertRuleRepository = ArchLucid.Core.Persistence.Ports.IAlertRuleRepository;
global using ICompositeAlertRuleRepository = ArchLucid.Core.Persistence.Ports.ICompositeAlertRuleRepository;
