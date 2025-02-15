import { db } from './db'; // Assuming you have a db module to interact with your database

const PERMISSIONS = {
    VERIFIED: 1 << 0, // 1
    MOD: 1 << 1, // 2
    OWNER: 1 << 2, // 4
};

function hasPermission(userPerms: number, permission: number): boolean {
    return (userPerms & permission) === permission;
}

async function addPermissionToUser(userId: string, permission: number): Promise<void> {
    try {
        const user = await db.user.findFirst({ where: { internalId: userId } });
        if (!user) {
            throw new Error('User not found');
        }
        const updatedPermissions = (user.permissions as number) | permission;
        await db.user.update({
            where: { internalId: userId },
            data: { permissions: updatedPermissions }
        });
    } catch (error) {
        console.error('Error adding permission to user:', error);
        throw error;
    }
}

async function removePermissionFromUser(userId: string, permission: number): Promise<void> {
    try {
        const user = await db.user.findFirst({ where: { internalId: userId } });
        if (!user) {
            throw new Error('User not found');
        }
        const updatedPermissions = (user.permissions as number) & ~permission;
        await db.user.update({
            where: { internalId: userId },
            data: { permissions: updatedPermissions }
        });
    } catch (error) {
        console.error('Error removing permission from user:', error);
        throw error;
    }
}

export { PERMISSIONS, hasPermission, addPermissionToUser, removePermissionFromUser };