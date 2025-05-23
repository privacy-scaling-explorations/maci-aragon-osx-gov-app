import { type ChainName } from "@/utils/chains";

/**
 * Converts a camelCase string to kebab-case
 */
export function camelToKebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Maps frontend chain names to backend-compatible format (ESupportedNetworks)
 */
export function toBackendChainFormat(chainName: ChainName): string {
  // Special cases that need custom mapping
  const specialMappings: Record<string, string> = {
    polygon: "matic",
    arbitrum: "arbitrum-one",
    // Add other special cases as needed
  };

  if (chainName in specialMappings) {
    return specialMappings[chainName];
  }

  // For others, convert from camelCase to kebab-case
  return camelToKebabCase(chainName);
}
