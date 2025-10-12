import React from 'react';

interface FDStatementPrintProps {
  fd: any;
  history: any[];
  formatDate: (date: string | null) => string;
  formatCurrency: (amount: string | number) => string;
  getTermDisplay: (fdType: string) => string;
}

const FDStatementPrint: React.FC<FDStatementPrintProps> = ({ fd, history, formatDate, formatCurrency, getTermDisplay }) => {
  if (!fd) return null;

  return (
    <div className="p-8 bg-white font-sans text-gray-900">
      <div className="text-right mr-4 mt-4 text-2xl font-bold text-green-800 ml-4">
            B<span className="text-2xl font-normal">-TRUST</span>
      </div>
      <h1 className="text-2xl font-bold mb-4">Fixed Deposit Statement</h1>
      
      <div className="mb-6 space-y-1 text-sm">
        <p><strong>FD Number:</strong> {fd.fd_id}</p>
        <p><strong>Customer Name:</strong> {fd.customer_name}</p>
        <p><strong>NIC Number:</strong> {fd.nic_number}</p>
        <p><strong>Account Number:</strong> {fd.account_id}</p>
        <p><strong>Account Type:</strong> {fd.account_type_name}</p>
        <p><strong>Principal Amount:</strong> {formatCurrency(fd.amount)}</p>
        <p><strong>Interest Rate:</strong> {fd.interest_rate}% p.a.</p>
        <p><strong>Term:</strong> {getTermDisplay(fd.fd_type)}</p>
        <p><strong>Start Date:</strong> {formatDate(fd.start_date)}</p>
        <p><strong>Maturity Date:</strong> {formatDate(fd.maturity_date)}</p>
        <p><strong>Status:</strong> {fd.status}</p>
        <p><strong>Current Value:</strong> {formatCurrency(fd.current_value)}</p>
        <p><strong>Monthly Interest:</strong> {formatCurrency(fd.monthly_interest)}</p>
      </div>

      <h2 className="text-xl font-bold mb-2">Interest Payment History</h2>
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2 text-left">Date</th>
            <th className="border border-gray-300 p-2 text-left">Amount</th>
            <th className="border border-gray-300 p-2 text-left">Reference</th>
            <th className="border border-gray-300 p-2 text-left">Description</th>
          </tr>
        </thead>
        <tbody>
          {history.length === 0 ? (
            <tr>
              <td colSpan={4} className="border border-gray-300 p-2 text-center">No interest payments yet</td>
            </tr>
          ) : (
            history.map((tx) => (
              <tr key={tx.transaction_id}>
                <td className="border border-gray-300 p-2">{formatDate(tx.time_date_stamp)}</td>
                <td className="border border-gray-300 p-2">{formatCurrency(tx.amount)}</td>
                <td className="border border-gray-300 p-2">{tx.reference_number}</td>
                <td className="border border-gray-300 p-2">{tx.description}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <p className="mt-6 text-xs text-gray-500">Printed on: {new Date().toLocaleString('en-LK')}</p>
    </div>
  );
};

export default FDStatementPrint;