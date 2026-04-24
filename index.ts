interface RootRequest {
  method?: string;
}

interface RootResponse {
  status: (code: number) => RootResponse;
  json: (payload: unknown) => void;
}

export default function handler(req: RootRequest, res: RootResponse): void {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, message: "Method Not Allowed" });
    return;
  }

  res.status(200).json({
    ok: true,
    service: "Xerion Telegram Bot",
    webhook: "/api/webhook"
  });
}
