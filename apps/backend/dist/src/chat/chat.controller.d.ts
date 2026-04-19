import { RequestUser } from '../common/types/request-user.type';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { ChatService } from './chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    sendMessage(req: {
        user: RequestUser;
    }, dto: SendChatMessageDto): Promise<{
        assistant: {
            id: string;
            role: "assistant";
            content: string;
            createdAt: string;
        };
        history: {
            id: string;
            role: "user" | "assistant";
            content: string;
            createdAt: string;
        }[];
    }>;
    getHistory(req: {
        user: RequestUser;
    }, limit?: string): Promise<{
        id: string;
        role: "user" | "assistant";
        content: string;
        createdAt: string;
    }[]>;
}
