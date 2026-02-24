# Azure Naming Conventions

Apply Azure Cloud Adoption Framework (CAF) naming conventions and enforce hard naming constraints per resource type.

## Naming Pattern

```
{prefix}-{workload}-{environment}-{region}-{instance}
```

Example: `st-datapipeline-prod-eastus-001`

## CAF Abbreviations

| Resource Type | Abbreviation | Example |
|---------------|-------------|---------|
| Resource Group | `rg` | `rg-datapipeline-prod` |
| Storage Account | `st` | `stdatapipelineprod` |
| App Service | `app` | `app-datapipeline-prod` |
| Function App | `func` | `func-ingest-prod` |
| Key Vault | `kv` | `kv-datapipeline-prod` |
| Cosmos DB | `cosmos` | `cosmos-datapipeline-prod` |
| SQL Server | `sql` | `sql-datapipeline-prod` |
| SQL Database | `sqldb` | `sqldb-orders-prod` |
| Container App | `ca` | `ca-api-prod` |
| AKS Cluster | `aks` | `aks-datapipeline-prod` |
| Virtual Network | `vnet` | `vnet-hub-prod` |
| Subnet | `snet` | `snet-app-prod` |
| NSG | `nsg` | `nsg-app-prod` |
| Log Analytics | `log` | `log-datapipeline-prod` |
| App Insights | `appi` | `appi-datapipeline-prod` |
| Service Bus | `sb` | `sb-datapipeline-prod` |
| Event Hub | `evh` | `evh-datapipeline-prod` |

## Hard Naming Constraints

These constraints cause deployment failures if violated. **The skill MUST enforce them.**

| Resource | Min | Max | Allowed Characters | Scope |
|----------|-----|-----|--------------------|-------|
| Storage Account | 3 | 24 | Lowercase letters and numbers only | Global |
| Key Vault | 3 | 24 | Alphanumeric and hyphens, start with letter | Global |
| Resource Group | 1 | 90 | Alphanumeric, hyphens, underscores, periods, parens | Subscription |
| Function App | 2 | 60 | Alphanumeric and hyphens | Global |
| App Service | 2 | 60 | Alphanumeric and hyphens | Global |
| Cosmos DB Account | 3 | 44 | Lowercase alphanumeric and hyphens | Global |
| SQL Server | 1 | 63 | Lowercase alphanumeric and hyphens, can't start/end with hyphen | Global |
| Container App | 2 | 32 | Lowercase alphanumeric and hyphens | Resource Group |
| AKS Cluster | 1 | 63 | Alphanumeric, hyphens, underscores | Resource Group |
| Virtual Network | 2 | 64 | Alphanumeric, hyphens, underscores, periods | Resource Group |

**Ref:** [Azure resource naming rules](https://learn.microsoft.com/azure/azure-resource-manager/management/resource-name-rules)

## Validation Rules

Before writing a resource name to the plan:
1. Check length against min/max for that resource type
2. Verify only allowed characters are used
3. Check uniqueness scope — globally unique names must be checked
4. Apply CAF abbreviation prefix
5. Include environment suffix for multi-environment plans
