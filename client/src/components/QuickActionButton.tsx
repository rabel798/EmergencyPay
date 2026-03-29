import React from 'react';
import { Link } from 'wouter';

interface QuickActionButtonProps {
  icon: string;
  label: string;
  path: string;
  delay?: number; // Keeping this for backward compatibility
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ icon, label, path }) => {
  return (
    <Link href={path}>
      <div className="flex flex-col items-center justify-center cursor-pointer">
        <div className="h-14 w-14 rounded-full bg-primary-100 flex items-center justify-center mb-2 hover:bg-primary-200 transition-colors">
          <i className={`${icon} text-2xl text-primary`}></i>
        </div>
        <span className="text-xs text-gray-700">{label}</span>
      </div>
    </Link>
  );
};

export default QuickActionButton;
