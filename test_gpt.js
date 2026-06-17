const { getGPTResponse } = require('./gpt');

const PASSWORD = '123';

async function test() {
    try {
        console.log("Testing GPT connection...");
        
        // Simple password check
        const input = "Enter password: ";
        console.log(input);
        
        // For automated testing, use password from env or default
        const password = process.env.TEST_PASSWORD || PASSWORD;
        
        if (password !== PASSWORD) {
            console.log("Access denied: Invalid password");
            return;
        }
        
        console.log("Access granted!");
        const reply = await getGPTResponse("Hello from test script!", "TestUser");
        console.log("GPT Reply:", reply);
    } catch (e) {
        console.error("Test failed:", e);
    }
}

test();
