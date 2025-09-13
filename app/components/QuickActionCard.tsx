import Link from 'next/link';
import React from 'react';

export interface ActionItem {
  icon: React.ReactElement;
  title: string;
  description: string;
  href: string;
  scroll?: boolean;
}

interface QuickActionCardProps {
  action: ActionItem;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({ action }) => {
  return (
    <Link
      href={action.href}
      className="bg-white border border-gray-200 rounded-2xl p-6 shadow hover:shadow-lg transition-all hover:scale-[1.02] flex flex-col gap-3"
    >
      <div className="flex items-center gap-2">
        {action.icon}
        <h3 className="text-lg font-semibold text-gray-900">{action.title}</h3>
      </div>
      <p className="text-sm text-gray-600">{action.description}</p>
    </Link>
  );
};