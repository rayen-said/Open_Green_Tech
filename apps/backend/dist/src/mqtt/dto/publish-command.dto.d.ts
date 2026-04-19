export declare class PublishCommandDto {
    mode?: 'AUTO' | 'MANUAL';
    temp_low?: number;
    temp_high?: number;
    hum_low?: number;
    lux_low?: number;
    moist_low?: number;
    heater?: boolean;
    fan?: boolean;
    pump?: boolean;
    humid?: boolean;
    light?: boolean;
    correlationId?: string;
}
