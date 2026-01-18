import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_SECRET = process.env.TWO_FACTOR_ENCRYPTION_KEY || 'default_secret_key_32_chars_long!!';
const IV_LENGTH = 16;

// Create a 32-byte key from the secret
const KEY = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
