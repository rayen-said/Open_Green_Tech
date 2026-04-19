"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const config_1 = require("prisma/config");
const datasourceUrl = process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'];
if (!datasourceUrl) {
    throw new Error('DIRECT_URL or DATABASE_URL must be set before running Prisma CLI commands.');
}
exports.default = (0, config_1.defineConfig)({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
    },
    datasource: {
        url: datasourceUrl,
    },
});
//# sourceMappingURL=prisma.config.js.map