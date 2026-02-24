# Requirements: azure-workload-planner

## Overview

A self-contained skill that analyzes a user's repository or workload requirements and produces a structured infrastructure deployment plan (JSON), generates IaC (Bicep or Terraform — user's choice), and executes deployment via CLI commands. The skill covers the full lifecycle: research → plan → generate → deploy.

## Relevant Specifications

- [Agent Skills Overview](https://agentskills.io/)
- [Agent Skills Specification](https://agentskills.io/specification)
- [Skill Authoring Guide](https://agentskills.io/specification)
- [Token Budgets](https://agentskills.io/specification)

## Skill Identity

- **Name:** `azure-workload-planner`
- **Folder:** `plugin/skills/azure-workload-planner/`
- **Target audience:** Infrastructure engineers, platform teams, and full-stack developers who need Azure infrastructure

## Input Scenarios

The skill must support four entry points:

1. **Repository analysis** — Scan the user's codebase (config files, dependencies, project structure) to infer infrastructure needs
2. **User-specified workload requirements** — User describes their workload in natural language (e.g., "event-driven serverless data pipeline")
3. **Multi-environment planning** — Planning across dev/staging/production with environment-specific sizing and configuration
4. **Import/evolve existing infrastructure** — Query live Azure resources and generate a plan reflecting current state + desired changes (future — not implemented in v1, but architecture should not preclude it)

## Output Format

### Infrastructure Plan JSON

Written to `.azure/infrastructure-plan.json`. Format based on `sample_infrastructure_plan.json` in the skill folder.

Key sections:
- **`meta`** — `planId`, `generatedAt`, `version`, `status`
- **`inputs`** — `userGoal`
- **`plan.resources[]`** — Each resource with:
  - `name`, `type`, `subtype`, `location`, `sku`, `properties`
  - `reasoning` (whyChosen, alternativesConsidered, tradeoffs)
  - `dependencies[]` and `dependencyReasoning`
  - `references[]` (links to Azure docs)
- **`plan.overallReasoning`** — summary, tradeoffs, gaps
- **`plan.validation`** — deployment coherence check
- **`plan.architecturePrinciples`** — guiding principles
- **`plan.references`** — architecture-level documentation links

### Status Lifecycle

The `meta.status` field gates deployment:

```
draft → reviewed → approved → deployed
```

- Plan starts as `draft`
- User reviews and sets to `approved`
- Deployment step **refuses to execute** unless status is `"approved"`
- After successful deployment, status updates to `"deployed"`

### Note on `existingPlanId`

The `existingPlanId` field from the sample is **not included in v1**. It was reserved for future import/evolve scenarios. The architecture should not preclude adding it later.

## Workflow Phases

### Phase 1: Research

The skill must research the correct properties for each resource:
- **SKUs** — Query available SKUs using `mcp_azure_mcp_quota`
- **Regions** — Verify region availability for selected resource types
- **Naming conventions** — Apply Azure Cloud Adoption Framework naming conventions, including hard naming constraints (e.g., storage account: 3–24 chars, lowercase alphanumeric only)
- **Resource properties** — Use `mcp_azure_mcp_bicepschema` for schema-driven property lookup
- **Architecture guidance** — Use `mcp_azure_mcp_cloudarchitect` for recommendations
- **Documentation** — Use `mcp_azure_mcp_documentation` to ground decisions in official Microsoft Learn docs
- **Subscription context** — Use `mcp_azure_mcp_subscription_list` and `mcp_azure_mcp_group_list` to confirm the user's Azure context

### Phase 2: Plan Generation

- Produce the `.azure/infrastructure-plan.json` file following the output format above
- Include reasoning for every resource choice
- Include dependency ordering between resources
- Present the plan to the user for review before proceeding

### Phase 3: IaC Generation

- **Bicep and Terraform** — user chooses which format
- Generate IaC files from the approved plan
- Use `mcp_azure_mcp_bicepschema` for Bicep schema accuracy
- Use `mcp_azure_mcp_deploy` `iac rules get` sub-command for IaC best practices
- Files should be modular (one file per logical group or module)

### Phase 4: Deployment

- **Bicep:** `az deployment group create`
- **Terraform:** `terraform init` → `terraform plan` → `terraform apply`
- Deployment **only executes** when `meta.status` is `"approved"`
- Require explicit user confirmation before running deployment commands
- Update `meta.status` to `"deployed"` after successful deployment

## Relevant MCP Tools

Azure MCP tools and `azd` should be preferred where possible over direct Azure CLI commands. Azure CLI commands should only be used when absolutely necessary (e.g., `az deployment group create` for Bicep deployment).

| Tool | Purpose |
|------|---------|
| `mcp_azure_mcp_cloudarchitect` | Generate architecture designs and recommendations based on requirements |
| `mcp_azure_mcp_bicepschema` | Retrieve Bicep schemas, templates, and resource definitions for IaC generation |
| `mcp_azure_mcp_deploy` | Deployment plan generation, IaC rules, app logs, architecture diagrams. Sub-commands: `plan get`, `iac rules get`, `architecture diagram generate` |
| `mcp_azure_mcp_quota` | Check available regions for resource types and verify quota/usage limits |
| `mcp_azure_mcp_documentation` | Search official Microsoft Learn docs for grounding decisions |
| `mcp_azure_mcp_subscription_list` | List available Azure subscriptions for scope selection |
| `mcp_azure_mcp_group_list` | List resource groups in a subscription |
| `mcp_azure_mcp_role` | RBAC role assignment management (for security planning) |

## Relationship to Existing Skills

This skill is **self-contained** and does not chain into `azure-prepare → azure-validate → azure-deploy`. Key differences from `azure-prepare`:

| Concern | azure-prepare | This skill |
|---------|---------------|------------|
| Input | App-centric (scans code, creates Dockerfiles) | Infra-first (workload requirements or repo context) |
| Output | `.azure/plan.md` (markdown) | `.azure/infrastructure-plan.json` (structured JSON) |
| IaC | Delegates to recipes (azd, bicep, terraform) | Generates Bicep or Terraform directly |
| Deploy | Hands off to azure-deploy | Self-contained deployment |
| Scope | Application deployment | Infrastructure provisioning |

## Skill File Structure

```
plugin/skills/azure-workload-planner/
├── SKILL.md                          # Main skill definition (< 5000 tokens)
├── REQUIREMENTS.md                   # This file
├── sample_infrastructure_plan.json   # Example output format
├── references/                       # Detailed docs (< 1000 tokens each)
│   ├── research.md                   # Research phase: SKUs, regions, naming
│   ├── naming-conventions.md         # Azure naming rules and constraints
│   ├── plan-schema.md                # JSON schema documentation
│   ├── bicep-generation.md           # Bicep IaC generation guidance
│   ├── terraform-generation.md       # Terraform IaC generation guidance
│   └── deployment.md                 # Deployment execution guidance
└── scripts/                          # Helper scripts (if needed)
```

## Cross-Platform Scripts

Any non-trivial scripts must include both bash and PowerShell versions for compatibility with Linux, Mac, and Windows environments. Trivial scripts may include only a bash version.

## Testing Requirements

Tests must be created following the patterns documented in `/tests/AGENTS.md`.

### Unit Tests (`tests/azure-workload-planner/unit.test.ts`)
- Validate SKILL.md metadata (`name`, `description`)
- Verify content contains expected sections (research, planning, IaC generation, deployment)
- Check that naming convention rules are documented
- Verify status lifecycle is documented

### Trigger Tests (`tests/azure-workload-planner/triggers.test.ts`)

**Should trigger (at least 5):**
- "Create an infrastructure plan for my Azure deployment"
- "Plan Azure infrastructure for a serverless data pipeline"
- "Generate Bicep templates for my workload"
- "Deploy infrastructure to Azure with Terraform"
- "What Azure resources do I need for this project?"
- "Create a multi-environment infrastructure plan"
- "Plan dev staging and production Azure environments"

**Should NOT trigger (at least 5):**
- "Write a Python script to parse CSV files"
- "Deploy my app to AWS"
- "How do I use Kubernetes on GCP?"
- "What's the weather today?"
- "Help me write unit tests for my React app"
- "Optimize my Azure costs" (→ azure-cost-optimization)
- "List my existing Azure resources" (→ azure-resource-lookup)

### Integration Tests (`tests/azure-workload-planner/integration.test.ts`)
- Mock MCP tool interactions
- Test that the skill produces valid JSON output matching the plan schema
- Test error handling for missing subscription context
- Test the status gate (deployment blocked when status ≠ approved)

### Scaffold Command
```bash
cp -r tests/_template tests/azure-workload-planner
# Update SKILL_NAME = 'azure-workload-planner' in each test file
npm test -- --testPathPattern=azure-workload-planner
```
