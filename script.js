// script.js

// เริ่มต้นใช้งาน Flatpickr (เลือกวันที่)
flatpickr(".datepicker", {
  dateFormat: "d/m/Y",
  locale: "th"
});

// คำนวณดอกเบี้ยอัตโนมัติ
document.getElementById("principal").addEventListener("input", function() {
  const principal = parseFloat(this.value);
  if (!isNaN(principal)) {
    const interest = principal * 0.14; // ดอกเบี้ย 14%
    document.getElementById("amount").value = interest.toFixed(2);
  } else {
    document.getElementById("amount").value = "";
  }
});

// คำนวณสัปดาห์ (ตามโค้ดเดิมของคุณ)
function calculateWeeks() {
    // รับค่าวันที่จากฟอร์ม
  const startDateInput = document.getElementById("start-date").value;
  const endDateInput = document.getElementById("end-date").value || flatpickr.formatDate(new Date(), "d/m/Y");
  const amount = parseFloat(document.getElementById("amount").value);

  if (isNaN(amount) || !startDateInput) {
    document.getElementById("result").textContent = "กรุณากรอกข้อมูลให้ครบถ้วน";
    return;
  }

  // แปลงค่าวันที่จากรูปแบบ dd/mm/yyyy เป็น Date object
  const [startDay, startMonth, startYear] = startDateInput.split("/");
  const [endDay, endMonth, endYear] = endDateInput.split("/");

  const startDate = new Date(`${startYear}-${startMonth}-${startDay}`);
  const endDate = new Date(`${endYear}-${endMonth}-${endDay}`);

  // ฟังก์ชันสำหรับแปลงวันที่เป็นรูปแบบ วัน/เดือน/ปี ภาษาไทย
  function formatDateThai(date) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return date.toLocaleDateString('th-TH', options);
  }

  let result = "";
  let currentDate = new Date(startDate);
  currentDate.setDate(currentDate.getDate() + 7);
  let weekCount = 1;

  while (currentDate <= endDate) {
    result += `${formatDateThai(currentDate)} = สัปดาห์ ที่ ${weekCount}\n`;
    currentDate.setDate(currentDate.getDate() + 7);
    weekCount++;
  }

  let daysRemaining = Math.floor((endDate - (currentDate - 7 * 24 * 60 * 60 * 1000)) / (1000 * 60 * 60 * 24));
  if (daysRemaining > 0 && daysRemaining < 7) {
    result += `${formatDateThai(endDate)} = ${daysRemaining} วัน\n`;
  }

  let totalAmount = (weekCount - 1) * amount;
  result += `\n${amount} x ${weekCount - 1} สัปดาห์ = ${totalAmount.toFixed(2)} บาท`;

  if (daysRemaining > 0 && daysRemaining < 7) {
    const dailyAmount = amount / 7;
    const remainingAmount = dailyAmount * daysRemaining;
    totalAmount += remainingAmount;
    result += `\n(${amount} ÷ 7 วัน) x ${daysRemaining} วัน = ${remainingAmount.toFixed(2)} บาท`;
  }
  result += `\nรวมเป็นเงิน ${totalAmount.toFixed(2)} บาท`;

  document.getElementById("result").textContent = result;
}

// Array สำหรับเก็บข้อมูลจำนำ
let pawnData = [];

// ฟังก์ชันเพิ่มข้อมูลจำนำ
function addPawnItem(customerName, brand, model, principal, interestRate, startDate, dueDate, pin, pattern) {
  let pawnItem = {
    customerName: customerName,
    brand: brand,
    model: model,
    principal: principal,
    interestRate: interestRate,
    startDate: startDate,
    dueDate: dueDate,
    pin: pin,
    pattern: pattern,
    timestamp: new Date() // บันทึกเวลา
  };
  pawnData.push(pawnItem);
  updateTable(pawnItem); // อัปเดตตาราง
  sendToGoogleSheet(pawnItem); // ส่งไป Google Sheet
}

// ฟังก์ชันอัปเดตตารางแสดงผล
function updateTable(item) {
  const table = document.getElementById("pawn-table").getElementsByTagName('tbody')[0];
  let newRow = table.insertRow();

  // เพิ่ม cell ในแต่ละแถว
  let cell1 = newRow.insertCell(0);
  let cell2 = newRow.insertCell(1);
  let cell3 = newRow.insertCell(2);
  let cell4 = newRow.insertCell(3);
  let cell5 = newRow.insertCell(4);
  let cell6 = newRow.insertCell(5);
  let cell7 = newRow.insertCell(6);

  // ใส่ข้อมูลลงใน cell
  cell1.innerHTML = item.customerName;
  cell2.innerHTML = item.brand;
  cell3.innerHTML = item.model;
  cell4.innerHTML = item.principal;
  cell5.innerHTML = item.interestRate + "%";
  cell6.innerHTML = item.startDate;
  cell7.innerHTML = item.dueDate;
}

// ฟังก์ชันเมื่อกดปุ่ม "บันทึก"
function submitForm() {
  // ดึงข้อมูลจาก form
  const customerName = document.getElementById("customer-name").value;
  const brand = document.getElementById("brand").value;
  const model = document.getElementById("model").value;
  const principal = parseFloat(document.getElementById("principal").value);
  const interestRate = parseFloat(document.getElementById("interest-rate").value);
  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;
  const pin = document.getElementById("pin").value;
  const pattern = document.getElementById("pattern").value;

  // --- Validation เพิ่มเติม ---
  if (!/^[1-9]+$/.test(pattern)) { // ตรวจว่าเป็นตัวเลข 1-9 เท่านั้น
    alert("รหัส Pattern ต้องเป็นตัวเลข 1-9 เท่านั้น");
    return;
  }
  if (pattern.length < 4 || pattern.length > 9) {
    alert("รหัส Pattern ต้องมีความยาว 4-9 ตัว");
    return;
  }
  if (new Set(pattern).size !== pattern.length) { // เช็คว่าไม่มีตัวเลขซ้ำ
    alert("รหัส Pattern ต้องไม่มีตัวเลขซ้ำ");
    return;
  }
  
  // ตรวจสอบข้อมูล (validation - เพิ่มเติมได้ตามต้องการ)
  if (!customerName || !brand || !model || isNaN(principal) || isNaN(interestRate) || !startDate) {
    alert("กรุณากรอกข้อมูลให้ครบถ้วน");
    return;
  }

  // เรียกฟังก์ชันเพิ่มข้อมูล
  addPawnItem(customerName, brand, model, principal, interestRate, startDate, endDate, pin, pattern);

  // ล้างค่าในฟอร์ม
  document.getElementById("customer-name").value = "";
  document.getElementById("brand").value = "";
  document.getElementById("model").value = "";
  document.getElementById("principal").value = "";
  document.getElementById("amount").value = ""; //ดอกเบี้ย
  document.getElementById("start-date").value = "";
  document.getElementById("end-date").value = "";
  document.getElementById("pin").value = "";
  document.getElementById("pattern").value = "";
  document.getElementById('pattern-preview').innerHTML = ''; // ล้าง preview
}

// แสดงตัวอย่าง pattern (ง่ายๆ)
document.getElementById('pattern').addEventListener('input', function() {
  let pattern = this.value;
  let preview = document.getElementById('pattern-preview');
  preview.innerHTML = ''; // ล้างค่าเก่า

  // วาด pattern (ตัวอย่างง่ายๆ)
  for (let i = 0; i < pattern.length; i++) {
    let dot = document.createElement('div');
    preview.appendChild(dot); // เพิ่ม dot ลงใน preview
  }
});

// ฟังก์ชันส่งข้อมูลไป Google Sheet
function sendToGoogleSheet(item) {
  const sheetUrl = 'https://script.google.com/macros/s/AKfycbwppUtFyEyJCJR3An1u_ZkaVvi27tevSCzkWJEQRtUJv3bhFXBopq2fcTQDnyECQpv7/exec'; // *** แทนที่ด้วย URL ของ Web app ***

  let formData = new FormData();
  for (let key in item) {
    formData.append(key, item[key]);
  }

  fetch(sheetUrl, {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    console.log('Data sent to Google Sheet:', data);
  })
  .catch(error => {
    console.error('Error sending data to Google Sheet:', error);
  });
}