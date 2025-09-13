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

interface TransactionsTabProps {
  transactions: Transaction[];
  filterType: "All" | "Deposit" | "Withdrawal";
  setFilterType: (type: "All" | "Deposit" | "Withdrawal") => void;
  searchField: "customer" | "account" | "ref" | "date";
  setSearchField: (field: "customer" | "account" | "ref" | "date") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  filterType,
  setFilterType,
  searchField,
  setSearchField,
  searchQuery,
  setSearchQuery,
}) => {
  const filteredTransactions = transactions.filter(
    (txn) =>
      txn.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.account.includes(searchQuery) ||
      txn.ref.includes(searchQuery)
  );

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-gray-500">Transaction History</h2>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {["All", "Deposit", "Withdrawal"].map((type) => (
          <Button
            key={type}
            variant="filter"
            active={filterType === type}
            onClick={() => setFilterType(type as "Deposit" | "Withdrawal" | "All")}
          >
            {type}
          </Button>
        ))}
        <Button
          variant="filter"
          onClick={() => alert("Dummy button clicked!")}
        >
          Processed by Me
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <select
          value={searchField}
          onChange={(e) => setSearchField(e.target.value as "ref" | "customer" | "account" | "date")}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="customer">Customer</option>
          <option value="account">Account Number</option>
          <option value="ref">Reference</option>
          <option value="date">Date</option>
        </select>
        <input
          type="text"
          placeholder={`Search by ${searchField}`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Filtered Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Date", "Customer", "Account Number", "Type", "Amount", "Reference"].map((th) => (
                <th
                  key={th}
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {th}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredTransactions
              .filter((txn) => filterType === "All" || txn.type === filterType)
              .filter((txn) => {
                const query = searchQuery.toLowerCase();
                if (!query) return true;

                switch (searchField) {
                  case "account":
                    return txn.account.toLowerCase().includes(query);
                  case "ref":
                    return txn.ref.toLowerCase().includes(query);
                  case "date":
                    return txn.date.includes(query);
                  default:
                    return txn.customer.toLowerCase().includes(query);
                }
              })
              .map((txn, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-4 py-3 text-xs text-gray-900">{txn.date}</td>
                  <td className="px-4 py-3 text-xs text-gray-900">{txn.customer}</td>
                  <td className="px-4 py-3 text-xs text-gray-900">{txn.account}</td>
                  <td
                    className={`px-4 py-3 text-xs font-medium ${
                      txn.type === "Deposit" ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {txn.type}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-900">
                    LKR {txn.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-900">{txn.ref}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};