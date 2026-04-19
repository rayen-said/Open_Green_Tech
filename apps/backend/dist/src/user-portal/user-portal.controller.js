"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPortalController = void 0;
const common_1 = require("@nestjs/common");
const upsert_user_profile_dto_1 = require("./dto/upsert-user-profile.dto");
const user_gamification_service_1 = require("./user-gamification.service");
const user_profile_service_1 = require("./user-profile.service");
let UserPortalController = class UserPortalController {
    profile;
    gamification;
    constructor(profile, gamification) {
        this.profile = profile;
        this.gamification = gamification;
    }
    getProfile(req) {
        return this.profile.getResponseJson(req.user.sub);
    }
    upsertProfile(req, dto) {
        return this.profile.upsert(req.user.sub, dto);
    }
    getGamification(req) {
        return this.gamification.getOrCreate(req.user.sub);
    }
    syncGamification(req, dto) {
        return this.gamification.sync(req.user.sub, dto);
    }
};
exports.UserPortalController = UserPortalController;
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserPortalController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Post)('profile'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, upsert_user_profile_dto_1.UpsertUserProfileDto]),
    __metadata("design:returntype", void 0)
], UserPortalController.prototype, "upsertProfile", null);
__decorate([
    (0, common_1.Get)('gamification'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserPortalController.prototype, "getGamification", null);
__decorate([
    (0, common_1.Post)('gamification'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, upsert_user_profile_dto_1.SyncGamificationDto]),
    __metadata("design:returntype", void 0)
], UserPortalController.prototype, "syncGamification", null);
exports.UserPortalController = UserPortalController = __decorate([
    (0, common_1.Controller)('user'),
    __metadata("design:paramtypes", [user_profile_service_1.UserProfileService,
        user_gamification_service_1.UserGamificationService])
], UserPortalController);
//# sourceMappingURL=user-portal.controller.js.map