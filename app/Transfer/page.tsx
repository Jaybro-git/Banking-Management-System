// app/Transfer/page.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import { TextInput } from '@/app/components/ui/TextInput';
import TransferReceiptPrint from '@/app/components/TransferReceiptPrint';

interface HeaderProps {
  activeTab: string;
}

const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Fund Transfer</h1>
        <p className="text-m text-gray-500">Transfer Funds Between Accounts and Manage</p>
      </div>
      <div className="flex items-center space-x-4">
        <Link href="/" passHref>
        <Button type="button" variant="danger" size="md" className="w-full mt-6">
            Cancel
        </Button>
        </Link>
      </div>
    </header>
  );
};

interface Holder {
  customerName: string;
  nic: string;
  phone: string;
  email: string;
}

interface AccountInfo {
  holders: Holder[];
  accountType: string;
  currentBalance: string;
  availableBalance?: string;
  isValid: boolean;
}

interface Transaction {
  transactionId: string;
  referenceNumber: string;
  time_date_stamp: string;
  fromBalanceBefore: number;
  fromBalanceAfter: number;
  toBalanceBefore: number;
  toBalanceAfter: number;
}

interface Account {
  account_id: string;
  account_type_name: string;
}

interface TransferHolder {
  first_name: string;
  last_name: string;
  nic_number: string;
  phone_number: string;
  email: string;
}

interface TransferAccountInfo {
  account: Account;
  holders: TransferHolder[];
}

interface TransferResult {
  transaction: Transaction;
  fromAccountInfo: TransferAccountInfo;
  toAccountInfo: TransferAccountInfo;
  transferAmount: string;
  remarks: string;
}

export default function TransferPage() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

  const [form, setForm] = useState({
    fromAccountNumber: '',
    toAccountNumber: '',
    transferAmount: '',
    remarks: '',
    idNumber: '' // For sender verification
  });

  const [fromAccountInfo, setFromAccountInfo] = useState<AccountInfo>({
    holders: [],
    accountType: '',
    currentBalance: '',
    availableBalance: '',
    isValid: false
  });

  const [toAccountInfo, setToAccountInfo] = useState<AccountInfo>({
    holders: [],
    accountType: '',
    currentBalance: '',
    isValid: false
  });

  const [transferResult, setTransferResult] = useState<TransferResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [senderVerified, setSenderVerified] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const verifySenderAccount = async () => {
    if (!form.fromAccountNumber || form.fromAccountNumber.length < 10 || !form.idNumber) {
      setError('Please enter sender account number (at least 10 characters) and NIC number.');
      return;
    }
    setLoading(true);
    setError('');
    setSenderVerified(false);
    setFromAccountInfo({
      holders: [],
      accountType: '',
      currentBalance: '',
      availableBalance: '',
      isValid: false
    });
    try {
      const res = await fetch(`${API_BASE_URL}/transactions/account/${form.fromAccountNumber}/info`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        // Check if idNumber matches any holder's nic
        const nicMatch = data.holders.some((holder: any) => holder.nic === form.idNumber);
        if (nicMatch) {
          setSenderVerified(true);
          setFromAccountInfo({
            holders: data.holders,
            accountType: data.accountType,
            currentBalance: data.currentBalance,
            availableBalance: data.availableBalance || data.currentBalance,
            isValid: true
          });
        } else {
          setError('NIC does not match the sender account holders.');
        }
      }
    } catch (err) {
      setError('Failed to fetch sender account info');
    } finally {
      setLoading(false);
    }
  };

  const checkReceiverAccount = async () => {
    if (!form.toAccountNumber || form.toAccountNumber.length < 10) {
      setError('Receiver account number must be at least 10 characters');
      return;
    }
    setLoading(true);
    setError('');
    setToAccountInfo({
      holders: [],
      accountType: '',
      currentBalance: '',
      isValid: false
    });
    try {
      const res = await fetch(`${API_BASE_URL}/transactions/account/${form.toAccountNumber}/info`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setToAccountInfo({
          holders: data.holders,
          accountType: data.accountType,
          currentBalance: data.currentBalance,
          isValid: true
        });
      }
    } catch (err) {
      setError('Failed to fetch receiver account info');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.fromAccountNumber === form.toAccountNumber) {
      setError('Cannot transfer to the same account');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/transactions/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          fromAccountId: form.fromAccountNumber,
          toAccountId: form.toAccountNumber,
          amount: parseFloat(form.transferAmount),
          description: form.remarks || 'Transfer'
        })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setTransferResult(data);
        alert('Transfer processed successfully!');
      }
    } catch (err) {
      setError('Failed to process transfer');
    } finally {
      setLoading(false);
    }
  };

  const canTransfer = () => {
    if (!form.transferAmount || !fromAccountInfo.isValid || !toAccountInfo.isValid) return false;
    const amount = parseFloat(form.transferAmount);
    const fromBalance = parseFloat(fromAccountInfo.currentBalance);
    return amount <= fromBalance && fromAccountInfo.isValid && toAccountInfo.isValid && senderVerified;
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto px-8 py-6 max-w-7xl">
        <Header activeTab="transfers" />
        
        {/* Form Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column - Account & Transfer Details */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Account & Transfer Information</h2>
                </div>

                {/* Sender Account Number */}
                <div className="flex items-end space-x-4">
                  <div className="flex-1">
                    <TextInput
                      label="From Account Number"
                      name="fromAccountNumber"
                      value={form.fromAccountNumber}
                      onChange={handleChange}
                      required
                      placeholder="Enter sender account number"
                    />
                  </div>
                </div> 

                {/* Sender Verification */}
                <div className="flex items-end space-x-4">
                  <div className="flex-1">
                    <TextInput
                      label="Sender NIC Number"
                      name="idNumber"
                      value={form.idNumber}
                      onChange={handleChange}
                      required
                      placeholder="Enter NIC for verification"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={verifySenderAccount}
                    disabled={loading || form.fromAccountNumber.length < 10 || !form.idNumber}
                  >
                    {loading ? 'Verifying...' : 'Verify'}
                  </Button>
                </div>

                {/* Receiver Account Number */}
                <div className="flex items-end space-x-4">
                  <div className="flex-1">
                    <TextInput
                      label="To Account Number"
                      name="toAccountNumber"
                      value={form.toAccountNumber}
                      onChange={handleChange}
                      required
                      placeholder="Enter receiver account number"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={checkReceiverAccount}
                    disabled={loading || form.toAccountNumber.length < 10}
                  >
                    {loading ? 'Checking...' : 'Check'}
                  </Button>
                </div> 

                {/* Transfer Amount */}
                <div>
                  <TextInput
                    label="Transfer Amount (LKR)"
                    name="transferAmount"
                    value={form.transferAmount}
                    onChange={handleChange}
                    required
                    placeholder="Enter transfer amount"
                  />
                </div>

                {/* Remarks */}
                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Remarks</label>
                  <textarea
                    name="remarks"
                    value={form.remarks}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Additional notes or remarks about this transaction..."
                  />
                </div>
              </div>

              {/* Right Column - Account Details */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Details</h2>
                </div>

                {/* Sender Account Info Display */}
                {fromAccountInfo.isValid && senderVerified && (
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <h3 className="font-semibold text-gray-800 mb-3">Sender Account Details</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Account Type:</strong> {fromAccountInfo.accountType}</div>
                      <div><strong>Current Balance:</strong> LKR {fromAccountInfo.currentBalance}</div>
                      <div><strong>Available Balance:</strong> LKR {fromAccountInfo.availableBalance}</div>
                      <div><strong>Account Holders:</strong></div>
                      {fromAccountInfo.holders.map((holder, index) => (
                        <div key={index} className="ml-4">
                          <div><strong>Name:</strong> {holder.customerName}</div>
                          <div><strong>NIC:</strong> {holder.nic}</div>
                          <div><strong>Phone:</strong> {holder.phone}</div>
                          <div><strong>Email:</strong> {holder.email}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Receiver Account Info Display */}
                {toAccountInfo.isValid && (
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <h3 className="font-semibold text-gray-800 mb-3">Receiver Account Details</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Account Type:</strong> {toAccountInfo.accountType}</div>
                      <div><strong>Current Balance:</strong> LKR {toAccountInfo.currentBalance}</div>
                      <div><strong>Account Holders:</strong></div>
                      {toAccountInfo.holders.map((holder, index) => (
                        <div key={index} className="ml-4">
                          <div><strong>Name:</strong> {holder.customerName}</div>
                          <div><strong>NIC:</strong> {holder.nic}</div>
                          <div><strong>Phone:</strong> {holder.phone}</div>
                          <div><strong>Email:</strong> {holder.email}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transaction Summary */}
                {form.transferAmount && fromAccountInfo.isValid && toAccountInfo.isValid && (
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <h4 className="font-semibold text-gray-800 mb-3">Transaction Summary</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <div><strong>From Account:</strong> {form.fromAccountNumber}</div>
                      <div><strong>To Account:</strong> {form.toAccountNumber}</div>
                      <div><strong>Amount:</strong> LKR {form.transferAmount}</div>
                      <div><strong>Remarks:</strong> {form.remarks || 'N/A'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end mt-8 pt-6 border-t border-gray-300">
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!transferResult || loading}
                  onClick={() => window.print()}
                >
                  Print Receipt
                </Button>
                <Button
                  type="submit"
                  disabled={!canTransfer() || loading}
                  className={`bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 ${(!canTransfer() || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Processing...' : 'Process Transfer'}
                </Button>
              </div>
            </div>
          </form>

          {transferResult && (
            <div className="receipt mt-8">
              <style>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  .receipt, .receipt * {
                    visibility: visible;
                  }
                  .receipt {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                  }
                }
              `}</style>
              <TransferReceiptPrint
                transaction={transferResult.transaction}
                fromAccountInfo={transferResult.fromAccountInfo}
                toAccountInfo={transferResult.toAccountInfo}
                transferAmount={transferResult.transferAmount}
                remarks={transferResult.remarks}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}