# pi-wafer

[Wafer Pass](https://wafer.ai) provider for [Pi](https://github.com/earendil-works/pi-mono). Registers Wafer as a model provider so you can use Wafer-hosted models directly from Pi.

## Available models

Available models depend on your Wafer Pass API key entitlement. The extension fetches your accessible models dynamically from Wafer's API at startup.

**Pass-included models** (commonly available):

| Model             | Context window | Max tokens | Reasoning                   | Cost (input/output)  |
| ----------------- | -------------- | ---------- | --------------------------- | -------------------- |
| Qwen3.5 397B A17B | 262K           | 32K        | ✅ DeepSeek format + effort | $0.60 / $3.60        |
| GLM 5.1           | 202K           | 32K        | ✅ ZAI format               | $1.50 / $4.50        |

**Serverless models** (separate billing, may require opt-in):
- Qwen3.6 35B A3B
- Kimi K2.6
- DeepSeek-V4-Pro

Run `/model wafer/` to see models available to your key.

## Install

```shell
pi install git:github.com/DarkoKuzmanovic/pi-wafer
```

Then restart Pi.

## Setup

On first use, Pi will prompt for your Wafer Pass API key. The key is stored in `~/.pi/agent/auth.json` and treated as a non-expiring credential.

Get an API key at [app.wafer.ai](https://app.wafer.ai).

## Usage

Switch models with `/model`:

```
/model wafer/GLM-5.1
/model wafer/DeepSeek-V4-Pro
```

## How it works

- Registers a `wafer` provider via `pi.registerProvider()`
- Uses Wafer's OpenAI-compatible Chat Completions endpoint (`/v1/chat/completions`)
- API key is stored as an OAuth credential with a far-future expiry and sent as `Authorization: Bearer <key>`
- Each model declaration includes context, pricing, and thinking metadata for Pi's model picker

## License

MIT
