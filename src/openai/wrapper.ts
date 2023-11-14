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
            description: "Chat GPT 4.0 Turbo being used by Matuz",
            model: "gpt-4-1106-preview",
            instructions:
                "You're being called in a cmd prompt, avoid markdown and code blocks",
        });
        return assistant;
    }

    async askPrompt(question: string): Promise<string> {
        return new Promise((resolve) => {
            process.stdout.write(question);
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

    async createRunAndWaitForCompletion(threadId: string, assistantId: string) {
        const run = await this.createRun(threadId, assistantId);
        let runStatus = await this.retrieveRun(threadId, run.id);

        while (runStatus.status !== "completed") {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            runStatus = await this.retrieveRun(threadId, run.id);
        }

        return runStatus;
    }
}

export default OpenAIWrapper;
