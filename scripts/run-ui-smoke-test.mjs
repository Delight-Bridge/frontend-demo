import { spawn } from "node:child_process";

const port = "5373";
process.env.APP_URL = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", port], {
  cwd: process.cwd(),
  env: process.env,
  stdio: ["ignore", "pipe", "pipe"],
});

try {
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      if ((await fetch(process.env.APP_URL)).ok) {
        ready = true;
        break;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }
  if (!ready) throw new Error("프론트 데모 서버가 시작되지 않았습니다.");
  await import("./ui-smoke-test.mjs");
} finally {
  server.kill("SIGTERM");
  await new Promise((resolve) => server.once("exit", resolve));
}
