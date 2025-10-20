// verify.js
// const bcrypt = require("bcrypt");

// const hash = "Hashed password from the DB";
// const testPassword = "Password which we think is correct";

// bcrypt.compare(testPassword, hash)
//   .then((result) => {
//     console.log("Password match:", result);
//   })
//   .catch((err) => {
//     console.error("Error:", err);
//   });


// reset_password_hash.js
const bcrypt = require("bcrypt"); 

const newPassword = "New password"; 
const saltRounds = 10;

bcrypt.hash(newPassword, saltRounds)
  .then((hash) => {
    console.log("New password hash:");
    console.log(hash);
  })
  .catch((err) => {
    console.error("Error generating hash:", err);
  });
