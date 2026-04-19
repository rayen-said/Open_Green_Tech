import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
type ChatRole = 'user' | 'assistant';
type ChatMessageView = {
    id: string;
    role: ChatRole;
    content: string;
    createdAt: string;
};
export declare class ChatService {
    private readonly prisma;
    private readonly configService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService);
    getHistory(userId: string, limit?: number): Promise<ChatMessageView[]>;
    sendMessage(userId: string, role: Role, dto: SendChatMessageDto): Promise<{
        assistant: {
            id: string;
            role: "assistant";
            content: string;
            createdAt: string;
        };
        history: ChatMessageView[];
    }>;
    private enforceRateLimit;
    private resolveLanguage;
    private buildContext;
    private generateWithLlm;
    private generateFallbackAnswer;
}
export {};
