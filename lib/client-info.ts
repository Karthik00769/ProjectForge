import { NextRequest } from "next/server";
import crypto from "crypto";

export function getClientInfo(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const ipHash = crypto.createHash("sha256").update(ip).digest("hex");
    const deviceFingerprintHash = crypto.createHash("sha256").update(userAgent).digest("hex");

    return { ipHash, deviceFingerprintHash };
}
