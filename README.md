## Microbanking and Interest Management System

B-Trust is a small private microfinance bank operating across several districts in Sri 
Lanka. The bank aims to support financial inclusion by offering basic savings products 
and fixed deposits, particularly for rural communities. To improve service efficiency, the 
bank has decided to digitise its core operations and offer customers the ability to deposit, 
withdraw, and monitor their balances through an online system managed by regional 
service agents. 
Your team has been hired to design the backend database of this Microbanking and 
Interest Management System (MIMS). A lightweight UI must be developed to allow QA 
testers to interact with the database and validate key operations. 
The system requirements are as follows: 
• The bank operates a series of service branches, each managing a team of 
banking agents. 
• Customers can register at any branch and are assigned to a specific agent. 
• Each customer can open one or more Savings Accounts, and account holders 
may be individuals or joint customers. 
• Savings Accounts are offered under different plans: 
o Children – 12% interest, no minimum balance 
o Teen – 11%, minimum LKR 500 
o Adult (18+) – 10%, minimum LKR 1000 
o Senior (60+) – 13%, minimum LKR 1000 
o Joint – 7%, minimum LKR 5000 
• Customers can make deposits and withdrawals at any time during business 
hours via the system. All transactions must be logged with timestamps, 
transaction type, and reference numbers. 
• Customers with an active Savings Account may open a Fixed Deposit (FD). FD 
options include: 
o 6 months – 13% 
o 1 year – 14% 
o 3 years – 15% 
• FD interest is calculated monthly and credited directly to the linked Savings 
Account. Each interest credit is treated as a separate transaction. A 30-day period 
is used as the monthly cycle for interest calculation. 
• Customers can only have one FD per Savings Account. 
• Customers may also apply for Joint Accounts, which allow multiple users to 
deposit or withdraw. 
• Only account holders meeting the minimum balance and eligibility criteria can 
perform withdrawals. Overdrafts are not allowed. 
• All interest calculations are processed by the central system. 
• The bank must keep track of transaction history, interest distributions, and 
account activity per customer. 
The management expects the following reports from the system: 
1. Agent-wise total number and value of transactions 
2. Account-wise transaction summary and current balance 
3. List of active FDs and their next interest payout dates 
4. Monthly interest distribution summary by account type 
5. Customer activity report (total deposits, withdrawals, and net balance) 