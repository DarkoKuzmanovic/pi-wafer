import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type {
	OAuthCredentials,
	OAuthLoginCallbacks,
} from "@earendil-works/pi-ai";

const WAFER_BASE_URL = "https://pass.wafer.ai/v1";
const NEVER_EXPIRES = 8_640_000_000_000_000; // Date max-ish, safely below JS max integer.

// Known model metadata (enrichment only, not a fallback list)
const MODEL_METADATA = [
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

// Cache for dynamically fetched models (per API key)
const modelCache = new Map<string, { models: ModelDef[]; fetchedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type ModelDef = {
	id: string;
	name: string;
	reasoning: boolean;
	input: readonly ["text"];
	contextWindow: number;
	maxTokens: number;
	cost: { input: number; output: number; cacheRead: number; cacheWrite: number };
	compat: {
		thinkingFormat: "deepseek" | "zai";
		supportsStore: boolean;
		supportsDeveloperRole: boolean;
		supportsReasoningEffort: boolean;
		supportsUsageInStreaming: boolean;
		maxTokensField: "max_tokens";
	};
	thinkingLevelMap?: Record<string, string | null | undefined>;
};

/**
 * Fetch the model catalog this API key is entitled to.
 * Throws on any failure — callers decide whether to register an empty list
 * or keep the previously-registered one.
 */
async function fetchWaferModels(apiKey: string): Promise<ModelDef[]> {
	const cacheKey = apiKey.slice(-8);
	const cached = modelCache.get(cacheKey);
	if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
		return cached.models;
	}

	const response = await fetch(`${WAFER_BASE_URL}/models`, {
		headers: { Authorization: `Bearer ${apiKey}` },
	});

	if (!response.ok) {
		throw new Error(`Wafer /models returned HTTP ${response.status}`);
	}

	const data = (await response.json()) as {
		data: Array<{
			id: string;
			object?: string;
			context_window?: number;
			max_tokens?: number;
		}>;
	};

	const models = data.data
		.filter((m) => m.id && !m.id.startsWith("dummy"))
		.map((m) => {
			// Enrich with known metadata where we have it; otherwise minimal entry.
			const known = MODEL_METADATA.find((f) => f.id === m.id);
			if (known) return known;
			return {
				id: m.id,
				name: m.id,
				reasoning: false,
				input: ["text" as const],
				contextWindow: m.context_window ?? 262144,
				maxTokens: m.max_tokens ?? 32768,
				cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
				compat: {
					thinkingFormat: "deepseek" as const,
					supportsStore: false,
					supportsDeveloperRole: false,
					supportsReasoningEffort: false,
					supportsUsageInStreaming: true,
					maxTokensField: "max_tokens" as const,
				},
			};
		});

	modelCache.set(cacheKey, { models, fetchedAt: Date.now() });
	return models;
}

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
	// Register provider with known-good metadata at startup.
	// ExtensionAPI does not expose modelRegistry — credentials are only
	// reachable inside the OAuth refreshToken callback below, which pi
	// invokes when it resolves auth for a request (e.g. first chat call).
	// That callback re-registers with the actual entitled catalog from
	// /v1/models, so the list stays accurate per API key.
	pi.registerProvider("wafer", {
		name: "Wafer Pass",
		baseUrl: WAFER_BASE_URL,
		api: "openai-completions",
		models: MODEL_METADATA,
		authHeader: true,
		oauth: {
			name: "Wafer Pass API Key",
			login: loginWafer,
			refreshToken: async (credentials) => {
				// pi invokes this when resolving the key for actual requests AND
				// after login completes. Use it to keep the model list fresh.
				try {
					const models = await fetchWaferModels(credentials.access);
					pi.registerProvider("wafer", {
						baseUrl: WAFER_BASE_URL,
						models,
					});
					console.log(
						`[pi-wafer] Refreshed catalog: ${models.length} entitled model(s)`,
					);
				} catch (error) {
					console.warn(
						`[pi-wafer] Catalog refresh failed: ${(error as Error).message}. ` +
							`Keeping previously-registered model list.`,
					);
					// Intentionally do NOT re-register with empty/fallback —
					// a transient network blip shouldn't blank the selector mid-session.
				}
				return credentials;
			},
			getApiKey: (credentials) => credentials.access,
		},
	});
}
