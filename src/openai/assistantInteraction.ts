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

async function mainGptLoop(chatGPT: OpenAIWrapper) {
    try {
        let assistantId = process.env.ASSISTANT_ID;
        assistantId = await chatGPT.checkAssistantExistence(assistantId);

        const thread = await chatGPT.createThread();
        let keepAsking = true;

        while (keepAsking) {
            const userQuestion = await chatGPT.askPrompt(
                chalk.blue("\nUser: ")
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

            const gptResponse = await handleGptResponse(
                lastMessageForCurrentRun
            );
            const totalTokens = getNumberOfTokens(userQuestion, gptResponse);
            const res = await pushToDataBase(totalTokens);

            if (lastMessageForCurrentRun) {
                console.log(chalk.green("ChatGPT: ") + gptResponse + "\n");
            } else {
                console.error(
                    chalk.red(
                        "Error: The last message for the current run does not contain text."
                    )
                );
            }
        }
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

export default mainGptLoop;
