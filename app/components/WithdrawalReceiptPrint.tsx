// app/components/WithdrawalReceiptPrint.tsx
import React from 'react';

interface WithdrawalReceiptPrintProps {
  transaction: any;
  accountInfo: any;
  withdrawalAmount: string;
  remarks: string;
}

const WithdrawalReceiptPrint: React.FC<WithdrawalReceiptPrintProps> = ({ transaction, accountInfo, withdrawalAmount, remarks }) => {
  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    const sriLankaTime = new Date(date);
    return sriLankaTime.toLocaleString('en-LK', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(Number(amount));
  };

  return (
    <div className="p-8 bg-white font-sans text-gray-900">
      <div className="text-right mr-4 mt-4 text-2xl font-bold text-green-800 ml-4">
        B<span className="text-2xl font-normal">-TRUST</span>
      </div>
      <h1 className="text-2xl font-bold mb-4">Withdrawal Receipt</h1>
      
      <div className="mb-6 space-y-1 text-sm">
        <p><strong>Reference Number:</strong> {transaction?.referenceNumber || 'N/A'}</p>
        <p><strong>Date:</strong> {formatDate(transaction?.time_date_stamp)}</p>
        <p><strong>Account Number:</strong> {accountInfo?.account?.account_id || 'N/A'}</p>
        <p><strong>Customer Name:</strong></p> {accountInfo?.holders?.map((holder: any, idx: number) => (
          <p key={idx}>{holder?.first_name} {holder?.last_name}</p>
        )) || null}
        <p><strong>Account Type:</strong> {accountInfo?.account?.account_type_name || 'N/A'}</p>
        <p><strong>Withdrawal Amount:</strong> {formatCurrency(withdrawalAmount)}</p>
        <p><strong>Purpose and Remarks:</strong> {remarks || 'N/A'}</p>
      </div>

      <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2 text-left">Type</th>
            <th className="border border-gray-300 p-2 text-left">Value</th>
            <th className="border border-gray-300 p-2 text-left">Remarks</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 p-2">Withdrawal</td>
            <td className="border border-gray-300 p-2">{formatCurrency(withdrawalAmount)}</td>
            <td className="border border-gray-300 p-2">{remarks || 'N/A'}</td>
          </tr>
        </tbody>
      </table>

      <p className="mt-6 text-xs text-gray-500">Printed on: {new Date().toLocaleString('en-LK')}</p>
    </div>
  );
};

export default WithdrawalReceiptPrint;