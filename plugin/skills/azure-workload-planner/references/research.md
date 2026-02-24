# Research Phase

Gather all information needed to make correct infrastructure decisions before generating the plan.

## Input Analysis

Determine the input scenario and gather requirements accordingly:

| Scenario | Action |
|----------|--------|
| **Repository analysis** | Scan project files: `package.json`, `requirements.txt`, `Dockerfile`, `*.csproj`, config files. Identify runtime, dependencies, and infrastructure needs. |
| **User requirements** | Ask user to describe their workload: purpose, expected traffic, data storage needs, security requirements, budget constraints. |
| **Multi-environment** | Ask which environments (dev/staging/prod) and how sizing differs between them. |

## MCP Tool Usage

### Architecture Recommendations

Use `mcp_azure_mcp_cloudarchitect` to get architecture guidance based on workload description:
- Provide the user's goal or requirements as input
- Extract recommended resource types and patterns

### SKU and Region Availability

Use `mcp_azure_mcp_quota` to verify:
- Which regions support the selected resource types
- Available SKUs and their limits in the target region
- Current quota usage in the user's subscription

### Azure Context

Use `mcp_azure_mcp_subscription_list` and `mcp_azure_mcp_group_list` to:
- List the user's available subscriptions
- Confirm which subscription to deploy into
- List existing resource groups or plan new ones

### Documentation

Use `mcp_azure_mcp_documentation` to:
- Search Microsoft Learn for service-specific best practices
- Ground architecture decisions in official documentation
- Populate the `references` array in the plan JSON with relevant doc URLs

## Research Checklist

For each resource in the plan, verify:

1. **Type** — Correct `Microsoft.*` resource type
2. **SKU** — Available in target region, appropriate for workload size
3. **Region** — Service available, data residency requirements met
4. **Name** — Complies with naming constraints (see [naming-conventions.md](naming-conventions.md))
5. **Dependencies** — All prerequisite resources identified and ordered
6. **Properties** — Required properties populated per resource schema
7. **Alternatives** — At least one alternative considered with tradeoff documented
