// utils.js
function getAgeFromDOB(dobYYYYMMDD) {
  const today = new Date();
  const dob = new Date(dobYYYYMMDD);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

module.exports = { getAgeFromDOB };
