# AGENTS.md — pi-wafer

Guidance for AI agents working on this project.

## What this project is

A [Pi coding agent](https://github.com/earendil-works/pi-mono) extension that registers [Wafer Pass](https://wafer.ai) as a model provider. Users switch to Wafer-hosted models via `/model wafer/<model-id>`.

Single file: `pi-wafer.ts`. That's the entire extension.

## Architecture

```
pi-wafer.ts          ← everything: models, OAuth login, provider registration
package.json          ← pi-package metadata + peerDependencies
```

Pi loads the extension at startup, calls the default export, and `pi.registerProvider("wafer", {...})` wires everything up. No build step — Pi runs the `.ts` directly.

## Key design decisions

1. **OpenAI-compatible, not Anthropic.** Wafer's API is OpenAI Chat Completions–compatible (`/v1/chat/completions`). A previous attempt switched to `anthropic-messages` — it broke all models. The `3c0e4a9` commit restored `openai-completions`. Do not change `api` or `baseUrl` away from `openai-completions` and `https://pass.wafer.ai/v1`.

2. **Thinking formats differ per model.** Each model declares `thinkingFormat` in its `compat` block:
   - `deepseek` — DeepSeek V4 Pro, Qwen3.5
   - `zai` — GLM 5.1 (its native format; do NOT switch to `deepseek` — it was tried and reverted)

3. **API key via Pi OAuth flow, not env var.** The initial version had `apiKey: 'WAFER_API_KEY'` as a fallback — removed in `0c9a7a0` because it sent a literal string when the env var was unset and OAuth hadn't completed. Always go through `loginWafer()`.

4. **Non-expiring credentials.** The `NEVER_EXPIRES` constant (8.64e15 ms) gives a far-future expiry. `refreshToken` is a no-op (returns credentials unchanged). This is intentional — Wafer keys don't expire.

5. **Qwen3.6 was removed.** The initial commit included `Qwen3.6-35B-A3B`. It was dropped in an uncommitted diff and not restored in the fix commit. The README has been updated to remove the stale entry. If restoring, it uses `deepseek` thinkingFormat, 262K context, 32K max tokens, free.

## Adding a new model

1. Add an entry to the `MODELS` array in `pi-wafer.ts`
2. Include: `id`, `name`, `reasoning`, `input`, `contextWindow`, `maxTokens`, `cost`, `compat` (with `thinkingFormat`, `maxTokensField`), and optionally `thinkingLevelMap`
3. Update the model table in `README.md`
4. Run `npm run typecheck` to validate

## Editing safely

- **Never change `api` from `openai-completions`** — Wafer is OpenAI-compatible
- **Never change `baseUrl` from `https://pass.wafer.ai/v1`** — the `/v1` path is required
- **Never change GLM-5.1's `thinkingFormat` from `zai`** — it was previously changed to `deepseek` and broke
- **Never add `apiKey` fallback** — always use the OAuth login flow
- After editing, run `npm run typecheck` (validates types with `tsc --noEmit --skipLibCheck`)

## Pi extension patterns

- Default export receives `ExtensionAPI`, calls `pi.registerProvider()`
- Peer dependencies: `@earendil-works/pi-coding-agent` and `@earendil-works/pi-ai` — never bundle these
- `package.json` must have `"keywords": ["pi-package"]` and `"pi": { "extensions": ["./pi-wafer.ts"] }`
- Install is via `pi install git:github.com/DarkoKuzmanovic/pi-wafer`, not npm install — edits are picked up on Pi restart

## Known issues

- **Masked input**: `OAuthPrompt` doesn't support a `secret` field yet, so the API key is entered in plain text. If Pi adds secret prompt support, update `loginWafer()` to use it.
- **README/model mismatch**: ✅ Fixed — Qwen3.6 35B removed from README to match source.
- **No tests**: No automated test suite. `typecheck` is the only validation. Consider adding a smoke test for model definitions.
