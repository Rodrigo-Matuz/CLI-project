import dotenv from "dotenv";
import OpenAIWrapper from "./wrapper";
import fs from "fs";
import chalk from "chalk";

dotenv.config();

async function mainGptLoop() {
    const chatGPT = new OpenAIWrapper();
    const thread = await chatGPT.createThread();
    let keepAsking = true;

    // This helps to not create an assistant if it already exists
    let assistantId = process.env.ASSISTANT_ID;
    if (!assistantId) {
        const assistant = await chatGPT.createAssistant();
        assistantId = assistant.id;
        fs.appendFileSync(".env", `\nASSISTANT_ID=${assistantId}`);
    }

    while (keepAsking) {
        const userQuestion = await chatGPT.askPrompt(
            chalk.blue("=".repeat(50)) + chalk.blue("\nUser: ")
        );
        await chatGPT.createMessage(userQuestion, thread.id);
        const runStatus = await chatGPT.createRunAndWaitForCompletion(
            thread.id,
            assistantId
        );
        const messages = await chatGPT.listMessages(thread.id);

        const lastMessageForCurrentRun = messages.data
            .filter(
                (message: { run_id: any; role: string }) =>
                    message.run_id === runStatus.id &&
                    message.role === "assistant"
            )
            .pop();

        if (
            lastMessageForCurrentRun &&
            "text" in lastMessageForCurrentRun.content[0]
        ) {
            console.log(
                chalk.green("ChatGPT: ") +
                    lastMessageForCurrentRun.content[0].text.value +
                    "\n"
            );
        } else {
            console.error(
                chalk.red(
                    "Error: The last message for the current run does not contain text."
                )
            );
        }
    }
}

export default mainGptLoop;
