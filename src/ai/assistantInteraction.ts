import dotenv from "dotenv";
import OpenAIWrapper from "./wrapper";
import chalk from "chalk";
import { ThreadMessage } from "openai/resources/beta/threads/messages/messages";
import { getNumberOfTokens } from "./tokenizing";
import { pushToDataBase } from "../../prisma/prisma";

dotenv.config();

async function handleGptResponse(message: ThreadMessage | undefined) {
    if (!message) {
        throw new Error(
            chalk.red("Error: No message found! Message Object is undefined")
        );
    }
    if ("text" in message.content[0]) {
        return message.content[0].text.value;
    } else {
        throw new Error(
            chalk.red(
                "Error: No text message found! Message Object has no text property"
            )
        );
    }
}

async function mainGptLoop(gpt: OpenAIWrapper) {
    console.clear();
    let assistantId = process.env.ASSISTANT_ID;
    assistantId = await gpt.checkAssistantExistence(assistantId);
    const thread = await gpt.createThread();
    let totalTokens = 0;
    console.log(
        chalk.yellow(
            'Type "-s PromptName -s" save prompt\n^ Usage: "-p PromptName +"\ntype "!!" to quit'
        )
    );
    async function gptLoop(assistantId: string) {
        const userQuestion = await gpt.askPrompt(chalk.cyan("User: "));

        if (userQuestion !== "!!") {
            await gpt.createMessage(userQuestion, thread.id);
            const runStatus = await gpt.createRunAndWaitForCompletion(
                thread.id,
                assistantId
            );
            const messages = await gpt.listMessages(thread.id);
            const lastMessageForCurrentRun = messages.data
                .filter(
                    (message: { run_id: any; role: string }) =>
                        message.run_id === runStatus.id &&
                        message.role === "assistant"
                )
                .pop();
            const gptResponse = await handleGptResponse(
                lastMessageForCurrentRun
            );
            if (lastMessageForCurrentRun) {
                console.log(chalk.green("gpt: ") + gptResponse + "\n");
            } else {
                console.error(
                    chalk.red(
                        "Error: The last message for the current run does not contain text."
                    )
                );
            }
            console.log(chalk.cyan("=".repeat(20) + "\n"));

            const tokens = getNumberOfTokens(userQuestion, gptResponse);
            totalTokens += tokens;
            await pushToDataBase(tokens);
            return gptLoop(assistantId);
        } else {
            console.log(chalk.yellow("\nTotal tokens: " + totalTokens));
            process.exit();
        }
    }
    await gptLoop(assistantId);
}

export default mainGptLoop;
