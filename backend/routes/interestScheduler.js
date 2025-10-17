// interestScheduler.js
const cron = require('node-cron');
const pool = require('../db/index');

async function payMonthlyInterest() {
  console.log('Running automatic Savings interest payment job...');
  try {
    // Fetch all active accounts with positive interest rates
    const accountsResult = await pool.query(`
      SELECT a.account_id, a.current_balance, at.interest_rate
      FROM public.account a
      JOIN public.account_type at ON a.account_type_id = at.account_type_id
      WHERE a.status = 'ACTIVE' AND at.interest_rate > 0
    `);

    for (const acc of accountsResult.rows) {
      // Calculate monthly interest: (balance * rate / 100) / 12, floored to 2 decimal places
      const interest = Math.floor((acc.current_balance * acc.interest_rate / 100 / 12) * 100) / 100;
      
      if (interest > 0) {
        await pool.query(`
          SELECT * FROM public.record_deposit($1, $2, $3, 'SAVINGS_INTEREST'::public.transaction_type_enum)
        `, [acc.account_id, interest, 'Monthly savings interest payment']);
      }
    }

    console.log('Monthly interest payments processed successfully');
  } catch (err) {
    console.error('Error processing monthly interest payments:', err);
  }
}

// For testing: uncomment to run every minute
// cron.schedule('* * * * *', payMonthlyInterest, {
//   timezone: 'Asia/Colombo'
// });

// Schedule to run on the 1st of every month at midnight (00:00)
cron.schedule('0 0 1 * *', payMonthlyInterest, {
  timezone: 'Asia/Colombo'
});

module.exports = { payMonthlyInterest }; // Export for testing or manual triggering