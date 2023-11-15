import dotenv from "dotenv";
import OpenAI from "openai";
import { ThreadMessage } from "openai/resources/beta/threads/messages/messages";
import { Run } from "openai/resources/beta/threads/runs/runs";
import { Thread, Threads } from "openai/resources/beta/threads/threads";
import fs from "fs";
import { resolve } from "path";

dotenv.config();

class OpenAIWrapper {
    openai: OpenAI;
    threads: Threads;

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

    // avoid duplicating same assistant
    async checkAssistantExistence(
        assistantId: string | undefined
    ): Promise<string> {
        if (!assistantId) {
            try {
                const assistant = await this.createAssistant();
                assistantId = assistant.id;
                fs.appendFileSync(".env", `\nASSISTANT_ID=${assistantId}`);
                return assistantId;
            } catch (e) {
                throw e;
            }
        }
        return assistantId;
    }

    async askPrompt(question: string): Promise<string> {
        return new Promise((resolve) => {
            process.stdout.write(question);
            process.stdin.once("data", (data) => {
                resolve(data.toString().trim());
            });
        });
    }

    async createThread(): Promise<Thread> {
        return await this.threads.create({});
    }

    async createMessage(
        message: string,
        threadId: string
    ): Promise<ThreadMessage> {
        return await this.threads.messages.create(threadId, {
            content: message,
            role: "user",
        });
    }

    async createRun(threadId: string, assistantId: string): Promise<Run> {
        return await this.threads.runs.create(threadId, {
            assistant_id: assistantId,
        });
    }

    async retrieveRun(threadId: string, runId: string): Promise<Run> {
        return await this.threads.runs.retrieve(threadId, runId);
    }

    async listMessages(threadId: string) {
        return await this.threads.messages.list(threadId);
    }

    async createRunAndWaitForCompletion(
        threadId: string,
        assistantId: string
    ): Promise<Run> {
        const run = await this.createRun(threadId, assistantId);
        let runStatus = await this.retrieveRun(threadId, run.id);

        while (runStatus.status !== "completed") {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            runStatus = await this.retrieveRun(threadId, run.id);
        }

        return runStatus;
    }
}

export function changeOrSetKey(key: string): string {
    try {
        const envPath = resolve(__dirname, "..", "..", ".env");
        let envFile = fs.readFileSync(envPath, "utf8");

        const keyIndex = envFile.indexOf("OPENAI_API_KEY=");
        if (keyIndex !== -1) {
            const endIndex = envFile.indexOf("\n", keyIndex);
            envFile =
                envFile.slice(0, keyIndex) +
                "OPENAI_API_KEY=" +
                key +
                envFile.slice(endIndex);
        } else {
            envFile += "\nOPENAI_API_KEY=" + key + "\n";
        }
        fs.writeFileSync(envPath, envFile);

        return "Success: OPENAI_API_KEY has been updated.";
    } catch (error) {
        return "Fail: " + error;
    }
}

export default OpenAIWrapper;
