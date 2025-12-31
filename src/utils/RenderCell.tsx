import React from "react";

interface RenderCellProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    className?: string;
}

export const RenderCell = ({ children, className = "", ...props }: RenderCellProps) => {
    return (
        <div className={`cell ${className}`} {...props}>
            {children}
        </div>
    );
};
