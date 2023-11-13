import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

class OpenAIWrapper {
    openai: OpenAI;
    threads: any;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.threads = this.openai.beta.threads;
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
        return await this.threads.create({});
    }

    async createMessage(message: string, threadId: string) {
        return await this.threads.messages.create(threadId, {
            role: "user",
            content: message,
        });
    }

    async createRun(threadId: string, assistantId: string) {
        return await this.threads.runs.create(threadId, {
            assistant_id: assistantId,
        });
    }

    async retrieveRun(threadId: string, runId: string) {
        return await this.threads.runs.retrieve(threadId, runId);
    }

    async listMessages(threadId: string) {
        return await this.threads.messages.list(threadId);
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

        const run = await chatGPT.createRun(thread.id, assistant.id);

        let runStatus = await chatGPT.retrieveRun(thread.id, run.id);

        while (runStatus.status !== "completed") {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            runStatus = await chatGPT.retrieveRun(thread.id, run.id);
        }

        const messages = await chatGPT.listMessages(thread.id);

        const lasMessageForRun = messages.data
            .filter(
                // simply inferring type of message from usage
                (message: { run_id: any; role: string }) =>
                    message.run_id === run.id && message.role === "assistant"
            )
            .pop();

        if (lasMessageForRun && "text" in lasMessageForRun.content[0]) {
            console.log("ChatGPT: " + lasMessageForRun.content[0].text.value);
        } else {
            throw new Error();
        }
    }
}

main();
