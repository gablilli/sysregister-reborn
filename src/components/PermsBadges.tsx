import { hasPermission, PERMISSIONS } from "@/lib/perms";
import { Crown, Shield } from "lucide-react";

export function PermsBadges({ permissions }: { permissions: number }) {
    if (!hasPermission(permissions, PERMISSIONS.OWNER) && !hasPermission(permissions, PERMISSIONS.MOD)) {
        return null;
    }
    return (
        <div className="flex items-center gap-1 opacity-80 rounded-sm">
            {hasPermission(permissions, PERMISSIONS.OWNER) && (<Crown size={"14"} fill={"gold"} stroke={"gold"} />)}
            {hasPermission(permissions, PERMISSIONS.MOD) && (<Shield size={"14"} fill={"red"} stroke={"red"} />)}
        </div>
    )
}