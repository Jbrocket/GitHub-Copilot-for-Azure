# azure-infra-planner Tests

## Prerequisites

```bash
npm install -g @github/copilot-cli
copilot  # authenticate
cd tests && npm install
```

## Golden Eval (end-to-end)

Runs golden prompts through `azure-infra-planner` → `plan-eval` pipeline. Artifacts go to `artifacts/<row>/<model>/`. Plan-eval (Phase 2) always runs on `claude-opus-4.6` for consistent scoring regardless of which model generates the plan.

```bash
cd tests

# Default model (claude-opus-4.6)
$env:NODE_OPTIONS="--experimental-vm-modules"
npx jest --testPathPattern "azure-infra-planner/golden-eval" --no-coverage

# Specific model
$env:NODE_OPTIONS="--experimental-vm-modules"
$env:EVAL_MODELS="gpt-4.1"
npx jest --testPathPattern "azure-infra-planner/golden-eval" --no-coverage

# Multiple models
$env:NODE_OPTIONS="--experimental-vm-modules"
$env:EVAL_MODELS="claude-opus-4.6,gpt-4.1,claude-sonnet-4"
npx jest --testPathPattern "azure-infra-planner/golden-eval" --no-coverage
```

### Custom artifact directory

Use `EVAL_ARTIFACT_DIR` to write results to a custom folder:

```bash
$env:NODE_OPTIONS="--experimental-vm-modules"
$env:EVAL_ARTIFACT_DIR="artifacts-run1"
npx jest --testPathPattern "azure-infra-planner/golden-eval" --no-coverage
```

## Other Tests

```bash
# Unit tests (fast, no CLI needed)
npx jest --testPathPattern "azure-infra-planner/unit" --no-coverage

# Integration tests
npx jest --testPathPattern "azure-infra-planner/integration" --no-coverage

# Plan quality evals
npx jest --testPathPattern "azure-infra-planner/evals/plan-quality" --no-coverage
```
