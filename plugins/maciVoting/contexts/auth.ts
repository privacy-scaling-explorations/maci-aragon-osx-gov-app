import { type KeyLike, publicEncrypt } from "crypto";

/**
 * @notice copied and renamed from encrypt, from https://github.com/privacy-scaling-explorations/maci/blob/dev/apps/coordinator/ts/crypto/crypto.service.ts
 * Converted from class method to function
 *
 * Encrypt plaintext with public key
 *
 * @param publicKey - public key
 * @param value - plaintext
 * @returns ciphertext
 */
export const encryptWithCoordinatorRSA = (publicKey: KeyLike, value: string): string => {
  try {
    const encrypted = publicEncrypt(publicKey, Buffer.from(value));

    return encrypted.toString("base64");
  } catch (error) {
    throw new Error(`Encryption error: ${error}`);
  }
};
