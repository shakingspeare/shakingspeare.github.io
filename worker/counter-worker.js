// Views and likes counter for shakingspeare.github.io (Cloudflare Worker + D1).
// GET /get/<namespace>/<key>  -> {"value": n}
// GET /hit/<namespace>/<key>  -> adds one, then {"value": n}
// D1 binding name: DB. Table: counters(k TEXT PRIMARY KEY, v INTEGER NOT NULL).

const NAMESPACES = ["shakingspeare", "shakingspeare-dev"];
const KEY = /^(views|likes)-[a-z0-9-]{1,80}$/;

export default {
  async fetch(request, env) {
    const headers = {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "cache-control": "no-store",
    };
    const send = (body, status) => new Response(JSON.stringify(body), { status: status || 200, headers });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "GET") return send({ error: "method" }, 405);

    const parts = new URL(request.url).pathname.split("/").filter(Boolean);
    const action = parts[0], ns = parts[1], key = parts[2];
    if (parts.length !== 3 || !NAMESPACES.includes(ns) || !KEY.test(key)) return send({ error: "not found" }, 404);
    const id = ns + "/" + key;

    try {
      if (action === "get") {
        const row = await env.DB.prepare("SELECT v FROM counters WHERE k = ?").bind(id).first();
        return send({ value: row ? row.v : 0 });
      }
      if (action === "hit") {
        const row = await env.DB.prepare(
          "INSERT INTO counters (k, v) VALUES (?, 1) ON CONFLICT(k) DO UPDATE SET v = v + 1 RETURNING v"
        ).bind(id).first();
        return send({ value: row.v });
      }
      return send({ error: "not found" }, 404);
    } catch (e) {
      return send({ error: "storage" }, 500);
    }
  },
};
