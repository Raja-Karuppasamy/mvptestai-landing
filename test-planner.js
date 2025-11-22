// test-planner.js
import { generateTestPlan } from './agent-planner.js';

async function testPlanner() {
  console.log('🧪 Testing AI Test Planner...\n');

  try {
    // Test Case 1: Basic URL with no specific requirements
    console.log('Test 1: Basic URL');
    const plan1 = await generateTestPlan('https://example.com');
    console.log('✅ Test Plan Generated:');
    console.log(JSON.stringify(plan1, null, 2));
    console.log('\n---\n');

    // Test Case 2: With specific user requirements
    console.log('Test 2: With specific requirements');
    const plan2 = await generateTestPlan(
      'https://myapp.com',
      'Test the signup flow and payment process'
    );
    console.log('✅ Test Plan Generated:');
    console.log(JSON.stringify(plan2, null, 2));
    console.log('\n---\n');

    // Validate structure
    console.log('📊 Validation:');
    console.log('- Has tests array:', Array.isArray(plan1.tests));
    console.log('- Test count:', plan1.tests.length);
    console.log('- First test has required fields:', 
      plan1.tests[0].category &&
      plan1.tests[0].name &&
      plan1.tests[0].priority &&
      plan1.tests[0].steps
    );

    console.log('\n✅ All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testPlanner();
