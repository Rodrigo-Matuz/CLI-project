import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

// still need to refactor useless functions here
class OpenAIWrapper {
    openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    async createAssistant() {
        const assistant = await this.openai.beta.assistants.create({
            name: "CLI Assistant",
            description: "You are being called and used in a terminal",
            model: "gpt-4-1106-preview",
            instructions: "Your output should be a max of 30 words",
        });
        return assistant;
    }

    async askPrompt(question: string): Promise<string> {
        return new Promise((resolve) => {
            process.stdout.write(question + "\n");
            process.stdin.once("data", (data) => {
                resolve(data.toString().trim());
            });
        });
    }

    async createThread() {
        return await this.openai.beta.threads.create({});
    }

    async createMessage(message: string, threadId: string) {
        return await this.openai.beta.threads.messages.create(threadId, {
            role: "user",
            content: message,
        });
    }

    async createRun(threadId: string, assistantId: string) {
        return await this.openai.beta.threads.runs.create(threadId, {
            assistant_id: assistantId,
        });
    }

    async retrieveRun(threadId: string, runId: string) {
        return await this.openai.beta.threads.runs.retrieve(threadId, runId);
    }

    async listMessages(threadId: string) {
        return await this.openai.beta.threads.messages.list(threadId);
    }

    async listSteps(threadId: string, runId: string) {
        return await this.openai.beta.threads.runs.steps.list(threadId, runId);
    }
    async getMessage(threadId: string, messageId: string) {
        return await this.openai.beta.threads.messages.retrieve(
            threadId,
            messageId
        );
    }
    async sendMessageAndGetResponse(threadId: string, message: string) {
        let response = null;
        while (response === null) {
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const messages = await this.listMessages(threadId);

            response = messages.data.find(
                (msg) =>
                    msg.role === "assistant" &&
                    msg.created_at > Date.now() - 1000
            );
        }

        return response;
    }
}

export default new OpenAIWrapper();

async function main() {
    const chatGPT = new OpenAIWrapper();
    const assistant = await chatGPT.createAssistant();
    const thread = await chatGPT.createThread();
    let keepAsking = true;
    while (keepAsking) {
        const userQuestion = await chatGPT.askPrompt(
            "\nChatGPT: What is your question? "
        );

        await chatGPT.createMessage(userQuestion, thread.id);

        // Use runs to wait for the assistant response and then retrieve it
        const run = await chatGPT.createRun(thread.id, assistant.id);

        let runStatus = await chatGPT.retrieveRun(thread.id, run.id);

        // Polling mechanism to see if runStatus is completed
        // This should be made more robust.
        while (runStatus.status !== "completed") {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            runStatus = await chatGPT.retrieveRun(thread.id, run.id);
        }

        const messages = await chatGPT.listMessages(thread.id);

        const lasMessageForRun = messages.data
            .filter(
                (message) =>
                    message.run_id === run.id && message.role === "assistant"
            )
            .pop();

        // there is a error here but it works fine, still need to fix
        if (lasMessageForRun) {
            console.log("ChatGPT: " + lasMessageForRun.content[0].text.value);
        }
    }
}

main();
