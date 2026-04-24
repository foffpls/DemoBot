interface NodeLikeResponse {
  status?: (code: number) => NodeLikeResponse;
  json?: (payload: unknown) => void;
  setHeader?: (name: string, value: string) => void;
  end?: (payload?: string) => void;
  statusCode?: number;
}

function sendNodeLike(res: NodeLikeResponse, code: number, payload: unknown): void {
  const statusFn = res.status;
  const jsonFn = res.json;
  if (typeof statusFn === "function" && typeof jsonFn === "function") {
    statusFn.call(res, code);
    jsonFn.call(res, payload);
    return;
  }

  res.statusCode = code;
  res.setHeader?.("content-type", "application/json; charset=utf-8");
  res.end?.(JSON.stringify(payload));
}

export default function handler(_req: unknown, res?: NodeLikeResponse): Response | void {
  const payload = {
    ok: true,
    service: "Xerion Telegram Bot",
    webhook: "/api/webhook"
  };

  if (!res) {
    return new Response(JSON.stringify(payload), { status: 200 });
  }
  sendNodeLike(res, 200, payload);
}
