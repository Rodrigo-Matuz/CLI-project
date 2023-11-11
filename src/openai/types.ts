// see https://platform.openai.com/docs/api-reference/messages/createMessage for reference
export type PromptResponseProps = {
    id: string;
    object: string;
    created_at: number;
    thread_id: string;
    role: string;
    content: Content[];
    file_ids: any[];
    assistant_id: null;
    run_id: null;
    metadata: Metadata;
};

export type ThreadProps = {
    id: string;
    object: string;
    created_at: number;
    metadata: Metadata;
};

export type Content = {
    type: string;
    text: Text;
};

export type Text = {
    value: string;
    annotations: any[];
};

export type Metadata = {};
