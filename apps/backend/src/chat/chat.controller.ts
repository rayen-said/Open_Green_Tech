import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RequestUser } from '../common/types/request-user.type';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  @Throttle({ default: { limit: 12, ttl: 60000 } })
  sendMessage(@Req() req: { user: RequestUser }, @Body() dto: SendChatMessageDto) {
    return this.chatService.sendMessage(req.user.sub, req.user.role, dto);
  }

  @Get('history')
  getHistory(@Req() req: { user: RequestUser }, @Query('limit') limit?: string) {
    const parsed = limit ? Number.parseInt(limit, 10) : 40;
    return this.chatService.getHistory(req.user.sub, parsed);
  }
}
