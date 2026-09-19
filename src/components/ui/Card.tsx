import React from "react";

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 ${
        onClick ? "cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
