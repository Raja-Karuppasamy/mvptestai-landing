// AI Test Planning Agent
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateTestPlan(url, userRequirements = '') {
  const prompt = `You are an expert QA testing agent. Create a comprehensive test plan for this MVP:

URL: ${url}
User Requirements: ${userRequirements || 'Test everything important'}

Generate a JSON test plan with these categories:
1. Functional tests (forms, buttons, links, auth)
2. UI/UX tests (responsive, visual consistency, navigation)
3. Performance tests (load time, API speed)
4. Accessibility tests (a11y compliance)
5. Security basics (HTTPS, exposed data)

Return JSON format:
{
  "tests": [
    {
      "category": "functional",
      "name": "Test signup form",
      "priority": "critical",
      "steps": ["Navigate to /signup", "Fill form", "Submit", "Verify success"],
      "expectedResult": "User created and redirected to dashboard"
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3
  });

  return JSON.parse(response.choices[0].message.content);
}

// Usage
const testPlan = await generateTestPlan('https://example.com', 'Test signup and dashboard');
console.log(testPlan);
