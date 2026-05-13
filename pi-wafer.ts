import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type {
	OAuthCredentials,
	OAuthLoginCallbacks,
} from "@earendil-works/pi-ai";

const WAFER_BASE_URL = "https://pass.wafer.ai/v1";
const NEVER_EXPIRES = 8_640_000_000_000_000; // Date max-ish, safely below JS max integer.

const MODELS = [
	{
		id: "DeepSeek-V4-Pro",
		name: "DeepSeek V4 Pro (Wafer)",
		reasoning: true,
		input: ["text" as const],
		contextWindow: 262144,
		maxTokens: 32768,
		cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
		compat: {
			thinkingFormat: "deepseek" as const,
			supportsStore: false,
			supportsDeveloperRole: false,
			supportsUsageInStreaming: true,
			maxTokensField: "max_tokens" as const,
		},
		thinkingLevelMap: {
			off: "low",
			minimal: null,
			low: "low",
			medium: null,
			high: "high",
		} as Record<string, string | null | undefined>,
	},
	{
		id: "Qwen3.5-397B-A17B",
		name: "Qwen3.5 397B A17B (Wafer)",
		reasoning: true,
		input: ["text" as const],
		contextWindow: 262144,
		maxTokens: 32768,
		cost: { input: 0.6, output: 3.6, cacheRead: 0.06, cacheWrite: 0 },
		compat: {
			thinkingFormat: "deepseek" as const,
			supportsStore: false,
			supportsDeveloperRole: false,
			supportsReasoningEffort: true,
			supportsUsageInStreaming: true,
			maxTokensField: "max_tokens" as const,
		},
	},
	{
		id: "GLM-5.1",
		name: "GLM 5.1 (Wafer)",
		reasoning: true,
		input: ["text" as const],
		contextWindow: 202752,
		maxTokens: 32768,
		cost: { input: 1.5, output: 4.5, cacheRead: 0.15, cacheWrite: 0 },
		compat: {
			thinkingFormat: "zai" as const,
			supportsStore: false,
			supportsDeveloperRole: false,
			supportsReasoningEffort: false,
			supportsUsageInStreaming: true,
			maxTokensField: "max_tokens" as const,
		},
		thinkingLevelMap: {
			off: "off",
			minimal: null,
			low: null,
			medium: null,
			high: "high",
		} as Record<string, string | null | undefined>,
	},
];

async function loginWafer(
	callbacks: OAuthLoginCallbacks,
): Promise<OAuthCredentials> {
	const key = (
		await callbacks.onPrompt({ message: "Enter your Wafer Pass API key:" })
	).trim();
	if (!key) throw new Error("Wafer API key is required");

	return {
		access: key,
		refresh: key,
		expires: NEVER_EXPIRES,
	};
}

export default function waferPassExtension(pi: ExtensionAPI) {
	pi.registerProvider("wafer", {
		name: "Wafer Pass",
		baseUrl: WAFER_BASE_URL,
		api: "openai-completions",
		models: MODELS,
		oauth: {
			name: "Wafer Pass API Key",
			login: loginWafer,
			refreshToken: async (credentials) => credentials,
			getApiKey: (credentials) => credentials.access,
		},
	});
}
