import { test, expect } from "vitest";
import { getNumberOfTokens } from "../ai/tokenizing";

test("Tokenization is working properly", () => {
    const message1 = "This message should have 7 tokens";

    const result = getNumberOfTokens(message1, message1);

    expect(result).toBe(14);
});
