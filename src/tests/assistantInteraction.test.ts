import { expect, test } from "vitest";
import { handleGptResponse } from "../ai/assistantInteraction";

import { ThreadMessage } from "openai/resources/beta/threads/messages/messages";

test("handleGptResponse should throws error if message is undefined", async () => {
    await expect(() => handleGptResponse(undefined)).toThrow;
});

test("handleGptResponse throws error if message does not contain text", async () => {
    const message = {} as ThreadMessage;
    await expect(() => handleGptResponse(message)).rejects.toThrow();
});

test("handleGptResponse returns text if message contains text", async () => {
    const message = {
        content: [{ text: { value: "Hello" } }],
    } as ThreadMessage;
    const result = await handleGptResponse(message);
    expect(result).toBe("Hello");
});
