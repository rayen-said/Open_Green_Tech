import { RequestUser } from '../common/types/request-user.type';
import { DevicesService } from '../devices/devices.service';
import { PublishCommandDto } from './dto/publish-command.dto';
import { MqttService } from './mqtt.service';
export declare class MqttController {
    private readonly mqttService;
    private readonly devicesService;
    constructor(mqttService: MqttService, devicesService: DevicesService);
    publishDeviceCommand(req: {
        user: RequestUser;
    }, deviceId: string, dto: PublishCommandDto): Promise<{
        topic: string;
        published: boolean;
    }>;
}
