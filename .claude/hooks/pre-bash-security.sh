#!/usr/bin/env bash
# Pre-bash security hook — blocks dangerous command patterns

CMD=$(jq -r '.tool_input.command // ""')

DANGEROUS_PATTERNS=(
  'rm[[:space:]]+-[rRfF]*f[rRfF]*[[:space:]]'
  'curl[[:space:]].*[|][[:space:]]*(ba)?sh'
  'wget[[:space:]].*[|][[:space:]]*(ba)?sh'
  'chmod[[:space:]]+777'
  'python3?[[:space:]]+-c'
  'node[[:space:]]+-e'
  '^eval[[:space:]]'
  '>[[:space:]]*/dev/(sd|hd|disk|nvme|sda|sdb|vd)'
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$CMD" | grep -qE "$pattern"; then
    echo "{\"decision\":\"block\",\"reason\":\"Blocked: dangerous command pattern matched: $pattern\"}"
    exit 0
  fi
done

exit 0
