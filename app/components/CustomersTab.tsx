import React from 'react';
import { Button } from './ui/Button';

interface Transaction {
  date: string;
  account: string;
  type: string;
  amount: number;
  ref: string;
  customer: string;
}

type CustomerFilterType =
  | "All"
  | "Savings Accounts"
  | "Joint Accounts"
  | "Fixed Deposits"
  | "Children's Accounts"
  | "Teen Accounts"
  | "Processed by Me";

type CustomerSearchField = "account" | "customer";

interface CustomersTabProps {
  transactions: Transaction[];
  customerFilterType: CustomerFilterType;
  setCustomerFilterType: (type: CustomerFilterType) => void;
  customerSearchField: CustomerSearchField;
  setCustomerSearchField: (field: CustomerSearchField) => void;
  customerSearchQuery: string;
  setCustomerSearchQuery: (query: string) => void;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({
  transactions,
  customerFilterType,
  setCustomerFilterType,
  customerSearchField,
  setCustomerSearchField,
  customerSearchQuery,
  setCustomerSearchQuery,
}) => {
  const filterTypes: CustomerFilterType[] = [
    "All",
    "Savings Accounts",
    "Joint Accounts",
    "Fixed Deposits",
    "Children's Accounts",
    "Teen Accounts",
    "Processed by Me",
  ];

  const getAccountType = (account: string): string => {
    if (account.startsWith("SA")) return "Savings";
    if (account.startsWith("JA")) return "Joint";
    if (account.startsWith("FD")) return "Fixed Deposit";
    if (account.startsWith("CA")) return "Children's";
    if (account.startsWith("TA")) return "Teen";
    return "Other";
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-gray-500">Customer Lookup</h2>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {filterTypes.map((type) => (
          <Button
            key={type}
            variant="filter"
            active={customerFilterType === type}
            onClick={() => setCustomerFilterType(type)}
          >
            {type}
          </Button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={customerSearchField}
          onChange={(e) => setCustomerSearchField(e.target.value as CustomerSearchField)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="account">Account Number</option>
          <option value="customer">Customer Name</option>
        </select>
        <input
          type="text"
          placeholder={`Search by ${customerSearchField}`}
          value={customerSearchQuery}
          onChange={(e) => setCustomerSearchQuery(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Filtered Customer Cards */}
      <div className="space-y-4">
        {transactions
          .filter((txn) => {
            if (customerFilterType === "All") return true;
            if (customerFilterType === "Processed by Me") return true; // dummy behavior

            const acct = txn.account.toLowerCase();
            if (customerFilterType === "Savings Accounts") return acct.startsWith("sa");
            if (customerFilterType === "Joint Accounts") return acct.startsWith("ja");
            if (customerFilterType === "Fixed Deposits") return acct.startsWith("fd");
            if (customerFilterType === "Children's Accounts") return acct.startsWith("ca");
            if (customerFilterType === "Teen Accounts") return acct.startsWith("ta");

            return true;
          })
          .filter((txn) => {
            const query = customerSearchQuery.toLowerCase();
            if (!query) return true;

            return txn[customerSearchField].toLowerCase().includes(query);
          })
          .map((txn, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{txn.customer}</h4>
                  <p className="text-xs text-gray-500">Account: {txn.account}</p>
                  <p className="text-xs text-gray-500">
                    Last Transaction: {txn.type} (LKR {txn.amount.toLocaleString()})
                  </p>
                  <p className="text-xs text-gray-500">
                    Account Type: {getAccountType(txn.account)}
                  </p>
                </div>
                <Button variant="primary" className="mt-2 sm:mt-0">
                  View Profile
                </Button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};