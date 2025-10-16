'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import { TextInput } from '@/app/components/ui/TextInput';
import WithdrawalReceiptPrint from '@/app/components/WithdrawalReceiptPrint';

interface HeaderProps {
  activeTab: string;
}

const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Withdrawal</h1>
        <p className="text-m text-gray-500">Process customer withdrawal requests</p>
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
  availableBalance: string;
  isValid: boolean;
}

interface Transaction {
  transactionId: string;
  referenceNumber: string;
  balanceBefore: number;
  balanceAfter: number;
  time_date_stamp: string;
  employee_id?: string; // Added to handle employee_id from backend
}

interface Account {
  account_id: string;
  account_type_name: string;
}

interface WithdrawalHolder {
  first_name: string;
  last_name: string;
  nic_number: string;
  phone_number: string;
  email: string;
}

interface WithdrawalAccountInfo {
  account: Account;
  holders: WithdrawalHolder[];
}

interface WithdrawalResult {
  transaction: Transaction;
  accountInfo: WithdrawalAccountInfo;
  withdrawalAmount: string;
  remarks: string;
}

export default function WithdrawalPage() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

  const [form, setForm] = useState({
    accountNumber: '',
    withdrawalAmount: '',
    withdrawalType: 'cash',
    purpose: '',
    verificationMethod: 'id',
    idNumber: '',
    remarks: ''
  });

  const [accountInfo, setAccountInfo] = useState<AccountInfo>({
    holders: [],
    accountType: '',
    currentBalance: '',
    availableBalance: '',
    isValid: false
  });

  const [withdrawalResult, setWithdrawalResult] = useState<WithdrawalResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const verifyAccount = async () => {
    if (!form.accountNumber || form.accountNumber.length < 10 || !form.idNumber) {
      alert('Please enter both account number (at least 10 characters) and NIC number.');
      return;
    }
    setLoading(true);
    setError('');
    setVerified(false);
    setAccountInfo({
      holders: [],
      accountType: '',
      currentBalance: '',
      availableBalance: '',
      isValid: false
    });
    try {
      const res = await fetch(`${API_BASE_URL}/transactions/account/${form.accountNumber}/info`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        // Check if idNumber matches any holder's nic
        const nicMatch = data.holders.some((holder: any) => holder.nic === form.idNumber);
        if (nicMatch) {
          setVerified(true);
          setAccountInfo({
            holders: data.holders,
            accountType: data.accountType,
            currentBalance: data.currentBalance,
            availableBalance: data.availableBalance,
            isValid: true
          });
        } else {
          alert('NIC does not match the account holders.');
        }
      }
    } catch (err) {
      alert('Failed to fetch account info');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const description = `Purpose: ${form.purpose} - Remarks: ${form.remarks || 'N/A'}`;
      const res = await fetch(`${API_BASE_URL}/transactions/withdrawal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Ensures JWT token is sent for employee_id extraction on backend
        body: JSON.stringify({
          accountId: form.accountNumber,
          amount: parseFloat(form.withdrawalAmount),
          description
        })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setWithdrawalResult(data);
        alert('Withdrawal processed successfully!');
      }
    } catch (err) {
      setError('Failed to process withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const canWithdraw = () => {
    if (!form.withdrawalAmount || !accountInfo.isValid) return false;
    const amount = parseFloat(form.withdrawalAmount);
    const current = parseFloat(accountInfo.currentBalance);
    return amount <= current;
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto px-8 py-6 max-w-7xl">
        <Header activeTab="withdrawal" />
        
        {/* Form Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Account & Withdrawal Information</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column - Account & Withdrawal Details */}
              <div className="space-y-6">
                
                {/* Account Number */}
                <div>
                  <TextInput
                    label="Account Number"
                    name="accountNumber"
                    value={form.accountNumber}
                    onChange={handleChange}
                    required
                    placeholder="Enter customer account number"
                  />
                </div>                

                {/* Withdrawal Amount */}
                <div>
                  <TextInput
                    label="Withdrawal Amount (LKR)"
                    name="withdrawalAmount"
                    value={form.withdrawalAmount}
                    onChange={handleChange}
                    required
                    placeholder="Enter withdrawal amount"
                  />
                </div>

                {/* Purpose */}
                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Purpose</label>
                  <select
                    name="purpose"
                    value={form.purpose}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Purpose</option>
                    <option value="personal">Personal Use</option>
                    <option value="business">Business</option>
                    <option value="medical">Medical Emergency</option>
                    <option value="education">Education</option>
                    <option value="other">Other</option>
                  </select>
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
                    placeholder="Additional notes about this withdrawal..."
                  />
                </div>
              </div>

              {/* Right Column - Verification & Transaction Details */}
              <div className="space-y-6">

                {/* Verification */}
                <div className="flex items-end space-x-4">
                  <div className="flex-1">
                    <TextInput
                      label="NIC Number"
                      name="idNumber"
                      value={form.idNumber}
                      onChange={handleChange}
                      required
                      placeholder="Enter NIC number for verification"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={verifyAccount}
                    disabled={loading}
                  >
                    {loading ? 'Verifying...' : 'Verify'}
                  </Button>
                </div>

                {/* Account Info Display */}
                {accountInfo.isValid && verified && (
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <h3 className="font-semibold text-gray-800 mb-3">Account Details</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Account Type:</strong> {accountInfo.accountType}</div>
                      <div><strong>Current Balance:</strong> LKR {accountInfo.currentBalance}</div>
                      <div><strong>Available Balance:</strong> LKR {accountInfo.availableBalance}</div>
                      <div><strong>Account Holders:</strong></div>
                      {accountInfo.holders.map((holder, index) => (
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
                {form.withdrawalAmount && accountInfo.isValid && (
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <h4 className="font-semibold text-gray-800 mb-3">Transaction Summary</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <div><strong>Account:</strong> {form.accountNumber}</div>
                      <div><strong>Amount:</strong> LKR {form.withdrawalAmount}</div>
                      <div><strong>Remarks:</strong> {form.remarks}</div>
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
                  disabled={!withdrawalResult || loading}
                  onClick={() => window.print()}
                >
                  Print Receipt
                </Button>
                <Button
                  type="submit"
                  disabled={!accountInfo.isValid || !verified || !form.withdrawalAmount || !canWithdraw() || !form.purpose || loading}
                  className={`bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 ${(!accountInfo.isValid || !verified || !form.withdrawalAmount || !canWithdraw() || !form.purpose || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Processing...' : 'Process Withdrawal'}
                </Button>
              </div>
            </div>
          </form>

          {withdrawalResult && (
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
              <WithdrawalReceiptPrint
                transaction={withdrawalResult.transaction}
                accountInfo={withdrawalResult.accountInfo}
                withdrawalAmount={withdrawalResult.withdrawalAmount}
                remarks={withdrawalResult.remarks}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}