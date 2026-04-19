import { UsersService } from './users.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
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
    updateRole(id: string, dto: UpdateUserRoleDto): Promise<{
        id: string;
        fullName: string;
        email: string;
        role: import("@prisma/client").$Enums.Role;
    }>;
}
