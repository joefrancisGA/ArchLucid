global using ArchLucid.Contracts.Alerts;
global using ArchLucid.Contracts.Alerts.Composite;
global using ArchLucid.Contracts.Alerts.Delivery;
global using ArchLucid.Contracts.Alerts.Simulation;

global using AlertRoutingCriteriaMetadata = ArchLucid.Core.Alerts.Delivery.AlertRoutingCriteriaMetadata;
global using IAlertDeliveryAttemptRepository = ArchLucid.Core.Persistence.Ports.IAlertDeliveryAttemptRepository;
global using IAlertDeliveryDispatcher = ArchLucid.Core.Persistence.Ports.IAlertDeliveryDispatcher;
global using IAlertRecordRepository = ArchLucid.Core.Persistence.Ports.IAlertRecordRepository;
global using IAlertRoutingSubscriptionRepository = ArchLucid.Core.Persistence.Ports.IAlertRoutingSubscriptionRepository;
global using IAlertRuleRepository = ArchLucid.Core.Persistence.Ports.IAlertRuleRepository;
global using ICompositeAlertRuleRepository = ArchLucid.Core.Persistence.Ports.ICompositeAlertRuleRepository;
global using IAlertService = ArchLucid.Decisioning.Alerts.IAlertService;
