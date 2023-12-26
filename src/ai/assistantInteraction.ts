import dotenv from "dotenv";
import OpenAIWrapper from "./wrapper";
import chalk from "chalk";
import { ThreadMessage } from "openai/resources/beta/threads/messages/messages";
import { getNumberOfTokens } from "./tokenizing";
import { pushToDataBase } from "../../prisma/prisma";

dotenv.config();

export async function handleGptResponse(message: ThreadMessage | undefined) {
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
    let totalTokens = 0;
    let assistantId = process.env.ASSISTANT_ID;
    assistantId = await gpt.checkAssistantExistence(assistantId);
    const thread = await gpt.createThread();

    console.log(chalk.yellow('type "!!" or "quit" to quit the program'));

    // recursive function
    async function gptLoop(assistantId: string) {
        const userQuestion = await gpt.askPrompt(chalk.cyan("User: "));

        // while loop removed, user can stop the process by typing "!!"" or "quit"
        if (userQuestion !== "!!" && userQuestion !== "quit") {
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

            // this part is only to calculate tokens and sum them for a final spend (user shouldn't interrupt the process)
            const tokens = getNumberOfTokens(userQuestion, gptResponse);
            totalTokens += tokens;
            await pushToDataBase(tokens);

            // calling the function inside its own
            return gptLoop(assistantId);
        } else {
            console.log(chalk.yellow("\nTotal tokens: " + totalTokens));
            process.exit();
        }
    }
    await gptLoop(assistantId);
}

export default mainGptLoop;
