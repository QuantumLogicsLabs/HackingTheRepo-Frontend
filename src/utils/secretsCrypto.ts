const DEFAULT_ENCRYPTION_KEY = "repomind-default-encryption-key-change-this";
const SALT = "repomind-secrets-salt";
const IV_LENGTH = 12;

function toBase64(bytes: ArrayBuffer | Uint8Array): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer;
}

async function getKey(): Promise<CryptoKey> {
  const envKey =
    import.meta.env.VITE_SECRETS_ENCRYPTION_KEY || DEFAULT_ENCRYPTION_KEY;
  if (!import.meta.env.VITE_SECRETS_ENCRYPTION_KEY) {
    console.warn(
      "VITE_SECRETS_ENCRYPTION_KEY is not defined. Secrets will still be encrypted, but using a default key.",
    );
  }

  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(envKey),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(SALT),
      iterations: 200000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptSecret(plain: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoder = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plain),
  );
  return `ENC:${toBase64(iv)}:${toBase64(ciphertext)}`;
}

export async function decryptSecret(cipherText: string): Promise<string> {
  if (!cipherText.startsWith("ENC:")) {
    return cipherText;
  }

  const [, ivBase64, cipherBase64] = cipherText.split(":");
  if (!ivBase64 || !cipherBase64) {
    throw new Error("Invalid encrypted payload");
  }

  const iv = fromBase64(ivBase64);
  const ciphertext = fromBase64(cipherBase64);
  const key = await getKey();
  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );
  return new TextDecoder().decode(plainBuffer);
}
