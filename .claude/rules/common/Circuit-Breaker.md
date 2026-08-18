## Circuit Breaker (3-Strike Rule)
- **Strike 1-3**: Attempt fix, log full error, analyze `tsconfig/package.json`.
- **Strike 4**: STOP. Present the "Failure Post-Mortem" to the human and wait.
