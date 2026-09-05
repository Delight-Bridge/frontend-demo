import { existsSync } from "node:fs";
import { chromium } from "playwright-core";

const candidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const executablePath = candidates.find((candidate) => existsSync(candidate));
if (!executablePath) throw new Error("Chrome 또는 Edge 실행 파일을 찾을 수 없습니다.");

const browser = await chromium.launch({ executablePath, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(process.env.APP_URL, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "어둠 속에 빛을 전하는 생명줄" }).waitFor();
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.getByRole("heading", { name: "로그인" }).waitFor();
  await page.getByRole("button", { name: "이메일로 시작하기" }).click();
  await page.getByRole("heading", { name: "이메일 로그인" }).waitFor();
  const emailDialog = page.getByRole("dialog", { name: "이메일 로그인" });
  await emailDialog.locator('input[type="email"]').fill("user@delightbridge.kr");
  await emailDialog.locator('input[type="password"]').fill("demo1234");
  await emailDialog.getByRole("button", { name: "이메일로 로그인" }).click();
  await page.getByText("김은혜", { exact: true }).first().waitFor();
  await page.getByRole("button", { name: "로그아웃" }).click();
  await page.locator("summary").filter({ hasText: "데모 로그인" }).click();
  await page.getByRole("button", { name: "관리자" }).click();
  await page.getByText("운영 관리자", { exact: true }).first().waitFor();
  await page.goto(`${process.env.APP_URL}/admin`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "대시보드" }).waitFor();
  await page.getByText("전체 회원", { exact: true }).waitFor();
  const errors = await page.locator('[role="alert"]').allTextContents();
  if (errors.length) throw new Error(`화면 오류가 표시되었습니다: ${errors.join(", ")}`);
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(process.env.APP_URL, { waitUntil: "domcontentloaded" });
  const overflow = await mobile.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  if (overflow) throw new Error("모바일 화면에 가로 오버플로가 있습니다.");
  console.log("Frontend demo UI smoke test passed.");
} finally {
  await browser.close();
}
