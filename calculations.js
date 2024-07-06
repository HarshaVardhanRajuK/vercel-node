require('dotenv').config();

const insuranceData = JSON.parse(process.env.INSURANCEDATA);
const ROIData = JSON.parse(process.env.ROIDATA);

function userRange(loanAmount) {
  let ligiRange = insuranceData.find(
    (range) => loanAmount >= range.min && loanAmount <= range.max
  );

  return ligiRange;
}

function CheckLifeAndHealthAmount(lifeRadio, healthRadio, loanAmount) {
  let result = {
    lifeAmount: 0,
    healthAmount: 0,
  };

  let ligiRange = userRange(loanAmount);

  if (!lifeRadio) {
    result.lifeAmount = 0;
  } else {
    result.lifeAmount = ligiRange.li;
  }

  if (!healthRadio) {
    result.healthAmount = 0;
  } else {
    result.healthAmount = ligiRange.gi;
  }

  return result;
}

function getBrokenCharges() {
  let brokenChargesValue = null;

  let now = new Date();

  let currentDay = now.getDate();
  let currentMonth = now.getMonth() + 1;
  let currentYear = now.getFullYear();

  if (currentDay > 15 || currentDay < 2) {
    let nextMonth;

    if (currentDay > 15) {
      nextMonth = new Date(currentYear, currentMonth, 2);
    } else if (currentDay < 2) {
      nextMonth = new Date(currentYear, currentMonth - 1, 2);
    }

    let diff = nextMonth - now;

    let days, total_hours, total_minutes, total_seconds;

    total_seconds = parseInt(Math.floor(diff / 1000));
    total_minutes = parseInt(Math.floor(total_seconds / 60));
    total_hours = parseInt(Math.floor(total_minutes / 60));
    days = parseInt(Math.floor(total_hours / 24));

    if (days === 0) {
      days++;
    }

    brokenChargesValue = (irr / (365 * 100)) * totalLoanAmount.value * days;
  } else {
    brokenChargesValue = 0;
  }

  return brokenChargesValue;
}

function calculate(req) {
  let { approvedLoanAmount, lifeRadio, healthRadio, fpr, irr, tenure } = req.body

  let { lifeAmount, healthAmount } = CheckLifeAndHealthAmount(
    lifeRadio,
    healthRadio,
    approvedLoanAmount
  );

  let finPulseReport = 0;

  if (fpr) {
    finPulseReport = 499;
  }

  let processingFee =
    ((approvedLoanAmount + lifeAmount + healthAmount + finPulseReport) *
      0.0393) /
    (1 - 0.0393);

  let totalGrossAmount =
    processingFee + lifeAmount + healthAmount + finPulseReport;

  let totalLoanAmount = totalGrossAmount + approvedLoanAmount;

  let roiTenObj = ROIData.find((ele) => ele.IRR === irr).Tenure;

  let ROIpa = roiTenObj[tenure];

  let ROIpm = ROIpa / 12;

  let emi = totalLoanAmount / tenure + (totalLoanAmount * ROIpa) / 1200;

  // error correction
  emi = emi * (1 + 0.00837 / 100);

  let totalRepaymentAmount = tenure * emi;

  let totalInterestAmount = totalRepaymentAmount - totalLoanAmount;

  const brokenCharges = getBrokenCharges();

  return {
    lifeAmount: lifeAmount,
    healthAmount: healthAmount,
    processingFee: processingFee.toFixed(3),
    totalGrossAmount: totalGrossAmount.toFixed(3),
    totalLoanAmount: totalLoanAmount.toFixed(3),
    emi: emi.toFixed(3),
    ROIpa: ROIpa.toFixed(3),
    ROIpm: ROIpm.toFixed(3),
    totalInterestAmount: totalInterestAmount.toFixed(3),
    totalRepaymentAmount: totalRepaymentAmount.toFixed(3),
    brokenCharges,
  };

}

module.exports = calculate