import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listUsers(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        fullName: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        _count: {
            devices: number;
        };
    }[]>;
    updateRole(userId: string, dto: UpdateUserRoleDto): Promise<{
        id: string;
        fullName: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
    }>;
}
