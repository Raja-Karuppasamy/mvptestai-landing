// test-executor.ts
import { chromium } from 'playwright';

type TestStep = string;

type SingleTest = {
  category: string;
  name: string;
  priority: string;
  steps: TestStep[];
  expectedResult: string;
};

type TestPlan = {
  tests?: SingleTest[];
  ui_ux_tests?: SingleTest[];
  performance_tests?: SingleTest[];
  accessibility_tests?: SingleTest[];
  security_tests?: SingleTest[];
};

type TestResult = {
  testName: string;
  category: string;
  priority: string;
  status: 'passed' | 'failed' | 'skipped';
  durationMs: number;
  error?: string;
};

export async function executeTestPlan(url: string, plan: TestPlan) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  const allTests: SingleTest[] = [
    ...(plan.tests || []),
    ...(plan.ui_ux_tests || []),
    ...(plan.performance_tests || []),
    ...(plan.accessibility_tests || []),
    ...(plan.security_tests || []),
  ];

  const results: TestResult[] = [];

  try {
    for (const test of allTests) {
      const start = Date.now();
      try {
        await runTest(page, url, test);
        results.push({
          testName: test.name,
          category: test.category,
          priority: test.priority,
          status: 'passed',
          durationMs: Date.now() - start,
        });
      } catch (err: any) {
        results.push({
          testName: test.name,
          category: test.category,
          priority: test.priority,
          status: 'failed',
          durationMs: Date.now() - start,
          error: err.message || String(err),
        });
      }
    }
  } finally {
    await browser.close();
  }

  return { results };
}

async function runTest(page: any, baseUrl: string, test: SingleTest) {
  // Very simple interpreter for now: just handle common step patterns
  for (const step of test.steps) {
    const s = step.toLowerCase();

    if (s.startsWith('navigate to')) {
      const match = step.match(/navigate to\s+(.+)/i);
      const path = match?.[1].trim() || '/';
      const targetUrl =
        path.startsWith('http') ? path : new URL(path, baseUrl).toString();
      await page.goto(targetUrl, { waitUntil: 'networkidle' });
    } else if (s.startsWith('click')) {
      // naive selector: look for button/link text
      const match = step.match(/click\s+["“”']?(.+?)["“”']?$/i);
      const text = match?.[1];
      if (text) {
        await page.getByRole('button', { name: text }).click().catch(async () => {
          await page.getByText(text, { exact: false }).first().click();
        });
      }
    } else if (s.includes('fill') && s.includes('email')) {
      const emailInput = page.getByRole('textbox', { name: /email/i });
      await emailInput.fill('user@example.com');
    } else if (s.includes('fill') && s.includes('password')) {
      const pwInput = page.getByRole('textbox', { name: /password/i }).or(
        page.getByLabel(/password/i),
      );
      await pwInput.fill('Password123!');
    } else if (s.includes('submit the form')) {
      await page.keyboard.press('Enter');
    } else if (s.includes('verify success message')) {
      await expectText(page, /success|welcome|thank/i);
    }
    // You can keep adding more patterns over time
  }
}

async function expectText(page: any, pattern: RegExp) {
  const content = await page.textContent('body');
  if (!content || !pattern.test(content)) {
    throw new Error(`Expected text matching ${pattern} not found`);
  }
}
