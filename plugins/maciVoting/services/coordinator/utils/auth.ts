import fs from "fs";
import { type KeyLike, publicEncrypt } from "crypto";
import { type Signer, getBytes } from "ethers";
import { hashMessage } from "viem";
import { ErrorCodes } from "./types";

/**
 * Encrypt plaintext with public key
 *
 * @param publicKey - public key
 * @param value - plaintext
 * @returns ciphertext
 */
const encrypt = (publicKey: KeyLike, value: string): string => {
  try {
    const encrypted = publicEncrypt(publicKey, Buffer.from(value));

    return encrypted.toString("base64");
  } catch (error) {
    throw new Error(`Error code: ${ErrorCodes.ENCRYPTION.toString()}, Error: ${error}`);
  }
};

/**
 * Encrypt a message using the coordinator's public key
 * @param message to encrypt
 * @returns encrypted message (ciphertext)
 */
export const encryptWithCoordinatorRSAPublicKey = async (message: string): Promise<string> => {
  const publicKey = await fs.promises.readFile(process.env.COORDINATOR_PUBLIC_KEY_PATH!);
  return encrypt(publicKey, message);
};

/**
 * Sign a message with a wallet and encrypt it using the coordinator's public key
 * @param signer
 * @returns Authorization header
 */
export const getAuthorizationHeader = async (signer: Signer): Promise<string> => {
  const signature = await signer.signMessage("message");
  const digest = Buffer.from(getBytes(hashMessage("message"))).toString("hex");
  const encrypted = await encryptWithCoordinatorRSAPublicKey(`${signature}:${digest}`);
  return `Bearer ${encrypted}`;
};
