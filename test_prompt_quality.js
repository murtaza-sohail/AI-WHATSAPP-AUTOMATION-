const { getGPTResponse } = require('./gpt');

async function runTests() {
    const testCases = [
        { name: "Greeting in Roman Urdu", input: "Asalam o alaikum bhai, kaise ho?" },
        { name: "Factual Question", input: "Pakistan ka PM kaun hai?" },
        { name: "Complex Query (testing brevity)", input: "Bhai mujhe batao ke coding kaise seekhte hain detail mein please." },
        { name: "Joke/Casual", input: "Ek joke sunao short sa." }
    ];

    console.log("--- Starting Prompt Quality Tests ---\n");

    for (const testCase of testCases) {
        console.log(`[Test: ${testCase.name}]`);
        console.log(`User: ${testCase.input}`);
        try {
            const reply = await getGPTResponse(testCase.input, "Tester");
            console.log(`Bot: ${reply}`);
            console.log(`Length: ${reply.split(' ').length} words`);
            console.log("------------------------------------\n");
        } catch (error) {
            console.error(`Test failed for ${testCase.name}:`, error);
        }
    }
}

runTests();
