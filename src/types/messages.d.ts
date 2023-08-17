import { Rule } from "./rule";

export interface WarningMessageBody {
    url: string;
}

export interface BlockMessageBody {
    url: string;
    count: number
}

export interface Message {
    rule: Rule;
    messageBody: WarningMessageBody | BlockMessageBody | null
}