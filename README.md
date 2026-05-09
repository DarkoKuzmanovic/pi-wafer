# pi-wafer

[Wafer Pass](https://wafer.ai) provider for [Pi](https://github.com/nicobailon/pi-coding-agent). Registers Wafer as a model provider so you can use Wafer-hosted models directly from Pi.

## Available models

| Model | Context window | Max tokens | Reasoning | Cost (input/output) |
|---|---|---|---|---|
| DeepSeek V4 Pro | 262K | 32K | ✅ DeepSeek format | Free |
| Qwen3.5 397B A17B | 262K | 32K | ✅ DeepSeek format + effort | $0.60 / $3.60 |
| GLM 5.1 | 202K | 32K | ✅ ZAI format | $1.50 / $4.50 |
| MiniMax M2.7 | 204K | 32K | ✅ DeepSeek format | Free |
| Qwen3.6 35B A3B | 262K | 32K | ✅ DeepSeek format | Free |

## Install

```bash
git clone https://github.com/DarkoKuzmanovic/pi-wafer.git ~/.pi/agent/git/github.com/DarkoKuzmanovic/pi-wafer
cd ~/.pi/agent/git/github.com/DarkoKuzmanovic/pi-wafer
chmod +x install.sh && ./install.sh
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
/model wafer/MiniMax-M2.7
```

## How it works

- Registers a `wafer` provider via `pi.registerProvider()`
- Uses the OpenAI Completions API format (`/v1/chat/completions`)
- API key is stored as an OAuth credential with a far-future expiry
- Each model declaration includes compatibility flags for thinking format, store support, and usage streaming

## License

MIT
