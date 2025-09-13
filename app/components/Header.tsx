import React from 'react';

interface HeaderProps {
  activeTab: 'overview' | 'transactions' | 'customers';
}

export const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  const getHeaderContent = () => {
    switch (activeTab) {
      case 'overview':
        return {
          title: 'Good Morning, Agent!',
          subtitle: 'Banking Agent Dashboard'
        };
      case 'transactions':
        return {
          title: 'Transaction History',
          subtitle: 'View recent transactions'
        };
      case 'customers':
        return {
          title: 'Accounts',
          subtitle: 'Manage customer accounts'
        };
      default:
        return {
          title: 'Dashboard',
          subtitle: 'Banking Dashboard'
        };
    }
  };

  const { title, subtitle } = getHeaderContent();

  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">{title}</h1>
        <p className="text-m text-gray-500">{subtitle}</p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-600">
          <span className="font-bold text-gray-900">Date</span> 06 Aug 2025
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-bold text-gray-900">Branch</span>: Moratuwa-004
        </div>
      </div>
    </header>
  );
};