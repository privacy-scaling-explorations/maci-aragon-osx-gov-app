import fs from "fs";
import { type KeyLike, publicEncrypt } from "crypto";
import { type JsonRpcSigner, type Signer, getBytes } from "ethers";
import { hashMessage } from "viem";

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
const encryptWithCoordinatorRSA = (publicKey: KeyLike, value: string): string => {
  try {
    const encrypted = publicEncrypt(publicKey, Buffer.from(value));

    return encrypted.toString("base64");
  } catch (error) {
    throw new Error(`Encryption error: ${error}`);
  }
};

/**
 * @notice encryptWithCoordinatorRSAPublicKey copied from https://github.com/privacy-scaling-explorations/maci/blob/dev/apps/coordinator/tests/utils.ts
 * Uses encrypt above function rather than calling CryptoService class
 *
 * Encrypt a message using the coordinator's public key
 * @param message to encrypt
 * @returns encrypted message (ciphertext)
 */
export const encryptWithCoordinatorRSAPublicKey = async (message: string): Promise<string> => {
  const publicKey = await fs.promises.readFile(process.env.COORDINATOR_PUBLIC_KEY_PATH!);
  return encryptWithCoordinatorRSA(publicKey, message);
};

/**
 * @notice getAuthorizationHeader copied from https://github.com/privacy-scaling-explorations/maci/blob/dev/apps/coordinator/tests/utils.ts
 *
 * Sign a message with a wallet and encrypt it using the coordinator's public key
 * @param signer
 * @returns Authorization header
 */
export const getAuthorizationHeader = async (signer: JsonRpcSigner | undefined): Promise<string> => {
  if (!signer) {
    throw new Error("Signer is undefined"); // TODO: handle this
  }
  const signature = await signer.signMessage("message");
  const digest = Buffer.from(getBytes(hashMessage("message"))).toString("hex");
  const encrypted = await encryptWithCoordinatorRSAPublicKey(`${signature}:${digest}`);
  return `Bearer ${encrypted}`;
};
