import { Loader, } from "lucide-react";
import React from "react";

const Button = ({
    children,
    className,
    loading = false,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode;
    className?: string;
    loading?: boolean;
}) => {
    return (
        <button
            className={`bg-primary transition-all cursor-pointer hover:opacity-80 py-3 px-2 rounded-xl text-lg font-bold ${className}`}
            {...props}
        >
            {loading ? (
                <div className="flex items-center justify-center w-full">
                    <Loader className="animate-spin" size={20} />
                </div>
            ) : (
                children
            )}
        </button>
    );
};

export default Button;
