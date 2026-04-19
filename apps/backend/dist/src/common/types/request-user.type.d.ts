import { Role } from '@prisma/client';
export type RequestUser = {
    sub: string;
    email: string;
    role: Role;
};
