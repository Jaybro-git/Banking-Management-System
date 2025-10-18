const express = require('express');
const pool = require('../db/index');
const authenticateToken = require('../middleware/auth');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');

const router = express.Router();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.use(cors({
  origin: true,
  credentials: true
}));

router.post('/generate', authenticateToken, async (req, res) => {
  const { reportType, dateFrom, dateTo, branchId, transactionType, email } = req.body;
  try {
    let data = [];
    let totals = {};
    let additionalData = []; // For interest-distribution-summary detailed transactions

    // Fetch branch name if branchId is provided
    let branchName = 'All Branches';
    if (branchId) {
      const branchRes = await pool.query('SELECT branch_name FROM branch WHERE branch_id = $1', [branchId]);
      if (branchRes.rows.length > 0) {
        branchName = branchRes.rows[0].branch_name;
      }
    }

    if (reportType === 'transaction-summary') {
      const typesMap = {
        deposit: ['DEPOSIT', 'INITIAL'],
        withdrawal: ['WITHDRAWAL'],
        transfer: ['TRANSFER_IN', 'TRANSFER_OUT'],
        fdinterest: ['FD_INTEREST'],
        savingsinterest: ['SAVINGS_INTEREST'],
      };
      const selectedTypes = transactionType ? typesMap[transactionType] || [] : [];
      let query = `
        SELECT time_date_stamp, reference_number, account_id, customer_names, transaction_type, amount, description, branch_name
        FROM v_transactions
        WHERE time_date_stamp BETWEEN $1 AND $2
      `;
      const params = [dateFrom, dateTo];
      let paramIndex = 3;
      if (branchId) {
        query += ` AND branch_id = $${paramIndex++}`;
        params.push(branchId);
      }
      if (selectedTypes.length > 0) {
        query += ` AND transaction_type IN (${selectedTypes.map((_, i) => `$${paramIndex + i}`).join(', ')})`;
        params.push(...selectedTypes);
      }
      query += ' ORDER BY time_date_stamp DESC';
      data = (await pool.query(query, params)).rows;

      let totalsQuery = `
        SELECT 
          SUM(CASE WHEN transaction_type IN ('DEPOSIT', 'INITIAL') THEN amount ELSE 0 END) as total_deposits,
          SUM(CASE WHEN transaction_type = 'WITHDRAWAL' THEN amount ELSE 0 END) as total_withdrawals,
          SUM(CASE WHEN transaction_type = 'TRANSFER_IN' THEN amount ELSE 0 END) as total_transfer_ins,
          SUM(CASE WHEN transaction_type = 'TRANSFER_OUT' THEN amount ELSE 0 END) as total_transfer_outs,
          SUM(CASE WHEN transaction_type = 'FD_INTEREST' THEN amount ELSE 0 END) as total_fd_interests,
          SUM(CASE WHEN transaction_type = 'SAVINGS_INTEREST' THEN amount ELSE 0 END) as total_savings_interests
        FROM v_transactions
        WHERE time_date_stamp BETWEEN $1 AND $2
      `;
      const totalsParams = [dateFrom, dateTo];
      paramIndex = 3;
      if (branchId) {
        totalsQuery += ` AND branch_id = $${paramIndex++}`;
        totalsParams.push(branchId);
      }
      if (selectedTypes.length > 0) {
        totalsQuery += ` AND transaction_type IN (${selectedTypes.map((_, i) => `$${paramIndex + i}`).join(', ')})`;
        totalsParams.push(...selectedTypes);
      }
      totals = (await pool.query(totalsQuery, totalsParams)).rows[0];
    } else if (reportType === 'active-fixed-deposits') {
      let query = 'SELECT * FROM v_active_fds';
      const params = [];
      if (branchId) {
        query += ' WHERE branch_id = $1';
        params.push(branchId);
      }
      query += ' ORDER BY start_date DESC';
      data = (await pool.query(query, params)).rows;
      let totalsQuery = `
        SELECT COUNT(*) as count, SUM(amount) as total_amount
        FROM v_active_fds
      `;
      if (branchId) {
        totalsQuery += ' WHERE branch_id = $1';
      }
      totals = (await pool.query(totalsQuery, branchId ? [branchId] : [])).rows[0];
    } else if (reportType === 'savings-interest-payment') {
      let query = `
        SELECT time_date_stamp, reference_number, account_id, customer_names, amount, description, branch_name
        FROM v_transactions
        WHERE transaction_type = 'SAVINGS_INTEREST'
        AND time_date_stamp BETWEEN $1 AND $2
      `;
      const params = [dateFrom, dateTo];
      let paramIndex = 3;
      if (branchId) {
        query += ` AND branch_id = $${paramIndex++}`;
        params.push(branchId);
      }
      query += ' ORDER BY time_date_stamp DESC';
      data = (await pool.query(query, params)).rows;
      let totalsQuery = `
        SELECT SUM(amount) as total_interest
        FROM v_transactions
        WHERE transaction_type = 'SAVINGS_INTEREST'
        AND time_date_stamp BETWEEN $1 AND $2
      `;
      const totalsParams = [dateFrom, dateTo];
      paramIndex = 3;
      if (branchId) {
        totalsQuery += ` AND branch_id = $${paramIndex++}`;
        totalsParams.push(branchId);
      }
      totals = (await pool.query(totalsQuery, totalsParams)).rows[0];
    } else if (reportType === 'fd-interest-payment') {
      let query = `
        SELECT time_date_stamp, reference_number, account_id, customer_names, amount, description, branch_name
        FROM v_transactions
        WHERE transaction_type = 'FD_INTEREST'
        AND time_date_stamp BETWEEN $1 AND $2
      `;
      const params = [dateFrom, dateTo];
      let paramIndex = 3;
      if (branchId) {
        query += ` AND branch_id = $${paramIndex++}`;
        params.push(branchId);
      }
      query += ' ORDER BY time_date_stamp DESC';
      data = (await pool.query(query, params)).rows;
      let totalsQuery = `
        SELECT SUM(amount) as total_interest
        FROM v_transactions
        WHERE transaction_type = 'FD_INTEREST'
        AND time_date_stamp BETWEEN $1 AND $2
      `;
      const totalsParams = [dateFrom, dateTo];
      paramIndex = 3;
      if (branchId) {
        totalsQuery += ` AND branch_id = $${paramIndex++}`;
        totalsParams.push(branchId);
      }
      totals = (await pool.query(totalsQuery, totalsParams)).rows[0];
    } else if (reportType === 'interest-distribution-summary') {
      let query = `
        SELECT account_type_name, 
          SUM(amount) as total_interest,
          COUNT(*) as payment_count
        FROM v_transactions
        WHERE transaction_type = 'SAVINGS_INTEREST'
        AND time_date_stamp BETWEEN $1 AND $2
      `;
      const params = [dateFrom, dateTo];
      let paramIndex = 3;
      if (branchId) {
        query += ` AND branch_id = $${paramIndex++}`;
        params.push(branchId);
      }
      query += ' GROUP BY account_type_name ORDER BY total_interest DESC';
      data = (await pool.query(query, params)).rows;

      let detailsQuery = `
        SELECT time_date_stamp, reference_number, account_id, customer_names, amount, description, branch_name, account_type_name
        FROM v_transactions
        WHERE transaction_type = 'SAVINGS_INTEREST'
        AND time_date_stamp BETWEEN $1 AND $2
      `;
      const detailsParams = [dateFrom, dateTo];
      paramIndex = 3;
      if (branchId) {
        detailsQuery += ` AND branch_id = $${paramIndex++}`;
        detailsParams.push(branchId);
      }
      detailsQuery += ' ORDER BY account_type_name, time_date_stamp DESC';
      additionalData = (await pool.query(detailsQuery, detailsParams)).rows;

      let totalsQuery = `
        SELECT SUM(amount) as grand_total
        FROM v_transactions
        WHERE transaction_type = 'SAVINGS_INTEREST'
        AND time_date_stamp BETWEEN $1 AND $2
      `;
      const totalsParams = [dateFrom, dateTo];
      paramIndex = 3;
      if (branchId) {
        totalsQuery += ` AND branch_id = $${paramIndex++}`;
        totalsParams.push(branchId);
      }
      totals = (await pool.query(totalsQuery, totalsParams)).rows[0];
    } else {
      return res.status(400).json({ error: 'Invalid report type' });
    }

    res.json({ data, totals, additionalData });

    if (email) {
      try {
        // Generate HTML for email (same as before)
        const formatDate = (date) => {
          if (!date) return 'N/A';
          const d = new Date(date);
          const sriLankaTime = new Date(d.getTime() + (5 * 60 + 30) * 60 * 1000);
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

        const formatCurrency = (amount) => {
          return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(Number(amount || 0));
        };

        const printDate = new Date().toLocaleString('en-LK');

        let title = '';
        let tableHeaders = [];
        let tableRows = [];
        let totalsSection = '';
        let additionalSection = '';

        if (reportType === 'transaction-summary') {
          title = 'Transaction Summary Report';
          tableHeaders = ['Date', 'Reference Number', 'Account ID', 'Customer Names', 'Type', 'Amount', 'Description', 'Branch'];
          tableRows = data.map(row => [
            formatDate(row.time_date_stamp),
            row.reference_number,
            row.account_id,
            row.customer_names || 'N/A',
            row.transaction_type || '',
            formatCurrency(row.amount),
            row.description || 'N/A',
            row.branch_name
          ]);
          totalsSection = `
            <div style="margin-top: 16px;">
              <h3 style="font-weight: bold;">Totals:</h3>
              <p>Total Deposits: ${formatCurrency(totals.total_deposits)}</p>
              <p>Total Withdrawals: ${formatCurrency(totals.total_withdrawals)}</p>
              <p>Total Transfer Ins: ${formatCurrency(totals.total_transfer_ins)}</p>
              <p>Total Transfer Outs: ${formatCurrency(totals.total_transfer_outs)}</p>
              <p>Total FD Interests: ${formatCurrency(totals.total_fd_interests)}</p>
              <p>Total Savings Interests: ${formatCurrency(totals.total_savings_interests)}</p>
            </div>
          `;
        } else if (reportType === 'active-fixed-deposits') {
          title = 'Active Fixed Deposits Report';
          tableHeaders = ['FD ID', 'Account ID', 'Customer Names', 'Amount', 'Interest Rate', 'Start Date', 'Next Payout Date', 'Branch'];
          tableRows = data.map(row => [
            row.fd_id,
            row.account_id,
            row.customer_names || 'N/A',
            formatCurrency(row.amount),
            `${row.interest_rate}%`,
            formatDate(row.start_date),
            formatDate(row.next_interest_payout_date),
            row.branch_name
          ]);
          totalsSection = `
            <div style="margin-top: 16px;">
              <h3 style="font-weight: bold;">Totals:</h3>
              <p>Total Active FDs: ${totals.count}</p>
              <p>Total Amount: ${formatCurrency(totals.total_amount)}</p>
            </div>
          `;
        } else if (reportType === 'savings-interest-payment' || reportType === 'fd-interest-payment') {
          title = reportType === 'savings-interest-payment' ? 'Savings Interest Payment Report' : 'FD Interest Payment Report';
          tableHeaders = ['Date', 'Reference Number', 'Account ID', 'Customer Names', 'Amount', 'Description', 'Branch'];
          tableRows = data.map(row => [
            formatDate(row.time_date_stamp),
            row.reference_number,
            row.account_id,
            row.customer_names || 'N/A',
            formatCurrency(row.amount),
            row.description || 'N/A',
            row.branch_name
          ]);
          totalsSection = `
            <div style="margin-top: 16px;">
              <p>Total Interest Paid: ${formatCurrency(totals.total_interest)}</p>
            </div>
          `;
        } else if (reportType === 'interest-distribution-summary') {
          title = 'Interest Distribution Summary';
          tableHeaders = ['Account Type', 'Total Interest', 'Payment Count'];
          tableRows = data.map(row => [
            row.account_type_name,
            formatCurrency(row.total_interest),
            row.payment_count.toString()
          ]);
          totalsSection = `
            <div style="margin-top: 16px;">
              <p>Grand Total: ${formatCurrency(totals.grand_total)}</p>
            </div>
          `;
          if (additionalData && additionalData.length > 0) {
            const groupedByAccountType = additionalData.reduce((acc, row) => {
              const accountType = row.account_type_name || 'Unknown';
              if (!acc[accountType]) {
                acc[accountType] = [];
              }
              acc[accountType].push(row);
              return acc;
            }, {});

            additionalSection = `
              <div style="margin-top: 24px;">
                <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Detailed Savings Interest Transactions</h3>
                ${Object.entries(groupedByAccountType).map(([accountType, transactions]) => `
                  <div key="${accountType}" style="margin-bottom: 24px;">
                    <h4 style="font-weight: 500; color: #1F2937; margin-bottom: 8px;">${accountType}</h4>
                    <p style="margin-bottom: 8px;">Total Rows: ${transactions.length}</p>
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #D1D5DB; font-size: 12px; margin-bottom: 16px;">
                      <thead>
                        <tr style="background-color: #F3F4F6;">
                          <th style="border: 1px solid #D1D5DB; padding: 8px; text-align: left;">Date</th>
                          <th style="border: 1px solid #D1D5DB; padding: 8px; text-align: left;">Reference Number</th>
                          <th style="border: 1px solid #D1D5DB; padding: 8px; text-align: left;">Account ID</th>
                          <th style="border: 1px solid #D1D5DB; padding: 8px; text-align: left;">Customer Names</th>
                          <th style="border: 1px solid #D1D5DB; padding: 8px; text-align: left;">Amount</th>
                          <th style="border: 1px solid #D1D5DB; padding: 8px; text-align: left;">Description</th>
                          <th style="border: 1px solid #D1D5DB; padding: 8px; text-align: left;">Branch</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${transactions.map((row, rowIdx) => `
                          <tr key="${rowIdx}">
                            <td style="border: 1px solid #D1D5DB; padding: 8px;">${formatDate(row.time_date_stamp)}</td>
                            <td style="border: 1px solid #D1D5DB; padding: 8px;">${row.reference_number}</td>
                            <td style="border: 1px solid #D1D5DB; padding: 8px;">${row.account_id}</td>
                            <td style="border: 1px solid #D1D5DB; padding: 8px;">${row.customer_names || 'N/A'}</td>
                            <td style="border: 1px solid #D1D5DB; padding: 8px;">${formatCurrency(row.amount)}</td>
                            <td style="border: 1px solid #D1D5DB; padding: 8px;">${row.description || 'N/A'}</td>
                            <td style="border: 1px solid #D1D5DB; padding: 8px;">${row.branch_name}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                `).join('')}
              </div>
            `;
          }
        }

        const html = `
          <div style="padding: 32px; background-color: white; font-family: sans-serif; color: #111827;">
            <div style="text-align: right; margin-right: 16px; margin-top: 16px; font-size: 24px; font-weight: bold; color: #047857; margin-left: 16px;">
              B<span style="font-size: 24px; font-weight: normal;">-TRUST</span>
            </div>
            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">${title}</h1>
            <div style="margin-bottom: 24px; line-height: 1.25; font-size: 12px;">
              ${dateFrom && dateTo ? `<p><strong>Date Range:</strong> ${dateFrom} to ${dateTo}</p>` : ''}
              <p><strong>Branch:</strong> ${branchName}</p>
            </div>
            <p style="margin-bottom: 8px;">Total Rows: ${tableRows.length}</p>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #D1D5DB; font-size: 12px; margin-bottom: 24px;">
              <thead>
                <tr style="background-color: #F3F4F6;">
                  ${tableHeaders.map(header => `<th style="border: 1px solid #D1D5DB; padding: 8px; text-align: left;">${header}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${tableRows.map(row => `
                  <tr>
                    ${row.map(cell => `<td style="border: 1px solid #D1D5DB; padding: 8px;">${cell}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ${totalsSection}
            ${additionalSection}
            <p style="margin-top: 24px; font-size: 10px; color: #6B7280;">Printed on: ${printDate}</p>
          </div>
        `;

        // Send email using SendGrid
        const msg = {
          to: email,
          from: 'bitsquadteam@gmail.com',  // Use a verified sender from SendGrid dashboard
          subject: `${title} - B-TRUST`,
          html: html,
        };

        await sgMail.send(msg);
      } catch (emailErr) {
        console.error('Email failed:', emailErr);
        // Don't crash the response; just log the error
      }
    }
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;