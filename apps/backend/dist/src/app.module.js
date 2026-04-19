"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const nestjs_pino_1 = require("nestjs-pino");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const devices_module_1 = require("./devices/devices.module");
const telemetry_module_1 = require("./telemetry/telemetry.module");
const recommendations_module_1 = require("./recommendations/recommendations.module");
const prisma_module_1 = require("./prisma/prisma.module");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
const alerts_module_1 = require("./alerts/alerts.module");
const admin_module_1 = require("./admin/admin.module");
const demo_module_1 = require("./demo/demo.module");
const chat_module_1 = require("./chat/chat.module");
const ai_module_1 = require("./ai/ai.module");
const user_portal_module_1 = require("./user-portal/user-portal.module");
const mqtt_module_1 = require("./mqtt/mqtt.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            nestjs_pino_1.LoggerModule.forRoot({
                pinoHttp: {
                    level: process.env.LOG_LEVEL ?? 'info',
                    transport: process.env.NODE_ENV === 'production'
                        ? undefined
                        : {
                            target: 'pino-pretty',
                            options: { singleLine: true, colorize: true },
                        },
                },
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 30,
                },
            ]),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            devices_module_1.DevicesModule,
            telemetry_module_1.TelemetryModule,
            recommendations_module_1.RecommendationsModule,
            alerts_module_1.AlertsModule,
            admin_module_1.AdminModule,
            demo_module_1.DemoModule,
            chat_module_1.ChatModule,
            ai_module_1.AiModule,
            user_portal_module_1.UserPortalModule,
            mqtt_module_1.MqttModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map