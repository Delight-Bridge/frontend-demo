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
  await emailDialog.getByText("또는", { exact: true }).waitFor();
  await emailDialog.getByRole("button", { name: "이메일로 회원가입" }).waitFor();
  await emailDialog.getByRole("button", { name: "비밀번호 재설정" }).waitFor();
  const emailLoginButton = emailDialog.getByRole("button", { name: "로그인", exact: true });
  if (!(await emailLoginButton.isDisabled())) {
    throw new Error("이메일과 비밀번호 입력 전 로그인 버튼이 활성화되어 있습니다.");
  }
  await emailDialog.locator('input[type="email"]').fill("user@delightbridge.kr");
  if (!(await emailLoginButton.isDisabled())) {
    throw new Error("비밀번호 입력 전 로그인 버튼이 활성화되어 있습니다.");
  }
  const passwordInput = emailDialog.locator('input[autocomplete="current-password"]');
  await passwordInput.fill("demo1234");
  if (await emailLoginButton.isDisabled()) {
    throw new Error("이메일과 비밀번호 입력 후 로그인 버튼이 활성화되지 않았습니다.");
  }
  await emailDialog.getByRole("button", { name: "비밀번호 표시" }).click();
  if ((await passwordInput.getAttribute("type")) !== "text") {
    throw new Error("비밀번호 표시 버튼이 입력 내용을 표시하지 못했습니다.");
  }
  await emailDialog.getByRole("button", { name: "비밀번호 숨기기" }).click();
  if ((await passwordInput.getAttribute("type")) !== "password") {
    throw new Error("비밀번호 숨기기 버튼이 입력 내용을 가리지 못했습니다.");
  }
  await emailDialog.getByLabel("로그인 유지").check();
  if (!(await emailDialog.getByLabel("로그인 유지").isChecked())) {
    throw new Error("로그인 유지 체크박스를 선택하지 못했습니다.");
  }
  await emailLoginButton.click();
  await emailDialog.waitFor({ state: "hidden" });
  await page.getByText("김은혜", { exact: true }).first().waitFor();
  const loginStorage = await page.evaluate(() => ({
    local: localStorage.getItem("delight-demo-user"),
    session: sessionStorage.getItem("delight-demo-user"),
  }));
  if (loginStorage.local !== "demo-user" || loginStorage.session !== null) {
    throw new Error(`로그인 유지 정보가 올바르게 저장되지 않았습니다: ${JSON.stringify(loginStorage)}`);
  }
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
