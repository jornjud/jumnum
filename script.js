// script.js

// เริ่มต้นใช้งาน Flatpickr
flatpickr(".datepicker", {
  dateFormat: "d/m/Y",
  locale: "th"
});

// คำนวณดอกเบี้ยอัตโนมัติ (เมื่อใส่เงินต้น)
document.getElementById("principal").addEventListener("input", function() {
  const principal = parseFloat(this.value);
  if (!isNaN(principal)) {
    const interest = principal * 0.14; // ดอกเบี้ย 14%
    document.getElementById("amount").value = interest.toFixed(2);
  } else {
    document.getElementById("amount").value = "";
  }
});

// --- ฟังก์ชัน calculateWeeks (ปรับปรุง) ---

function calculateWeeks() {
    // ... (ส่วนการรับค่า, ตรวจสอบ, แปลงวันที่ เหมือนเดิม) ...
    const startDateInput = document.getElementById("start-date").value;
    const endDateInput = document.getElementById("end-date").value || flatpickr.formatDate(new Date(), "d/m/Y"); // ใช้วันที่ปัจจุบันถ้าไม่ได้ระบุ
    const amount = parseFloat(document.getElementById("amount").value);

    if (isNaN(amount) || !startDateInput) {
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        });
        return;
    }

    // แปลงค่าวันที่จากรูปแบบ dd/mm/yyyy เป็น Date object
    const [startDay, startMonth, startYear] = startDateInput.split("/");
    const [endDay, endMonth, endYear] = endDateInput.split("/");

    const startDate = new Date(`${startYear}-${startMonth}-${startDay}`);
    const endDate = new Date(`${endYear}-${endMonth}-${endDay}`);

    // ตรวจสอบว่า startDate และ endDate ถูกต้องหรือไม่
    if (startDate > endDate) {
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด',
        });
        return;
    }
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
// ---

// Array สำหรับเก็บข้อมูลจำนำ
let pawnData = [];

// --- ฟังก์ชันเพิ่มข้อมูลจำนำ (ปรับปรุง) ---
function addPawnItem(customerName, brand, model, principal, interest, startDate, dueDate, pin, status = "กำลังจำนำ") { // เพิ่ม status, กำหนดค่าเริ่มต้น
  let pawnItem = {
    customerName: customerName,
    brand: brand,
    model: model,
    principal: principal,
    interestRate: interest,
    startDate: startDate,
    dueDate: dueDate, //  dueDate จะถูกเซ็ตค่าในฟังก์ชัน submitForm()
    pin: pin,
    timestamp: new Date()
  };
  pawnData.push(pawnItem);
  updateTable(pawnItem); // อัปเดตตาราง
  sendToGoogleSheet(pawnItem); // ส่งไป Google Sheet
}
// ---

// --- ฟังก์ชันอัปเดตตารางแสดงผล (ปรับปรุง) ---
function updateTable(item) {
  const table = document.getElementById("pawn-table").getElementsByTagName('tbody')[0];
  let newRow = table.insertRow();

  // เพิ่ม cell ในแต่ละแถว
    let cell1 = newRow.insertCell(0); // customerName
    let cell2 = newRow.insertCell(1); // brand
    let cell3 = newRow.insertCell(2); // model
    let cell4 = newRow.insertCell(3); // principal
    let cell5 = newRow.insertCell(4); // interestRate
    let cell6 = newRow.insertCell(5); // startDate
    let cell7 = newRow.insertCell(6); // dueDate
    

  // ใส่ข้อมูลลงใน cell
  cell1.innerHTML = item.customerName;
  cell2.innerHTML = item.brand;
  cell3.innerHTML = item.model;
  cell4.innerHTML = item.principal;
  cell5.innerHTML = item.interestRate;
  cell6.innerHTML = item.startDate;
  cell7.innerHTML = item.dueDate;
    
}
// ---
// --- ฟังก์ชันแสดง modal แก้ไข (Edit) ---
function editPawnItem(index) {
    const item = pawnData[index];

    Swal.fire({
        title: 'แก้ไขรายการจำนำ',
        html: `
            <input type="text" id="edit-customer-name" class="swal2-input" placeholder="ชื่อลูกค้า" value="<span class="math-inline">\{item\.customerName\}"\>
<input type\="text" id\="edit\-brand" class\="swal2\-input" placeholder\="ยี่ห้อ" value\="</span>{item.brand}">
            <input type="text" id="edit-model" class="swal2-input" placeholder="รุ่น" value="<span class="math-inline">\{item\.model\}"\>
<input type\="number" id\="edit\-principal" class\="swal2\-input" placeholder\="เงินต้น" value\="</span>{item.principal}">
            <input type="text" id="edit-start-date" class="swal2-input datepicker" placeholder="วันที่จำนำ" value="<span class="math-inline">\{item\.startDate\}"\>
<input type\="text" id\="edit\-end\-date" class\="swal2\-input datepicker" placeholder\="วันครบกำหนด" value\="</span>{item.dueDate}">
              <input type="text" id="edit-pin" class="swal2-input" placeholder="รหัส PIN" value="<span class="math-inline">\{item\.pin\}"\>
<select id\="edit\-status" class\="swal2\-input"\></span>{statusOptions}</select>

        `,
        showCancelButton: true,
        confirmButtonText: 'บันทึก',
        cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
            // เก็บข้อมูลที่แก้ไข
              const customerName = document.getElementById('edit-customer-name').value;
            const brand = document.getElementById('edit-brand').value;
            const model = document.getElementById('edit-model').value;
            const principal = parseFloat(document.getElementById('edit-principal').value);
            const startDate = document.getElementById('edit-start-date').value;
            const endDate = document.getElementById('edit-end-date').value;
             const pin = document.getElementById('edit-pin').value;
            



            // ตรวจสอบข้อมูล
            if (!customerName || !brand || !model || isNaN(principal) || !startDate ) {
                Swal.showValidationMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
                return false;
            }
            // อัปเดตข้อมูลใน pawnData array
            pawnData[index] = {
                ...item, // คงค่าเดิมไว้
                customerName,
                brand,
                model,
                principal,
                startDate,
                dueDate : endDate,
                pin,
                
            };

            updateTableAfterEdit(index, pawnData[index]); // อัปเดตตาราง
            sendToGoogleSheet(pawnData[index], index + 1); // ส่งไป Google Sheet (index + 1 เพราะ row ใน Sheet เริ่มที่ 1)

        }

    }).then((result) => {
         if (result.isConfirmed) {
        Swal.fire('บันทึกแล้ว!', '', 'success');
         }
    });
      // Initialize flatpickr for date inputs in the modal
    flatpickr(".datepicker", {
        dateFormat: "d/m/Y",
        locale: "th"
    });
}
// ---

// เพิ่มส่วนนี้ (จัดการ dropdown ยี่ห้อ)
document.getElementById('brand').addEventListener('change', function() {
  const otherInput = document.getElementById('brand-other');
  if (this.value === 'Other') {
    otherInput.style.display = 'block';
    otherInput.focus();
  } else {
    otherInput.style.display = 'none';
  }
});
//

// --- ฟังก์ชันเมื่อกดปุ่ม "บันทึก" (ปรับปรุง) ---
function submitForm() {
    // ดึงข้อมูลจาก form
    const customerName = document.getElementById("customer-name").value;
    let brand = document.getElementById("brand").value; // ใช้ let
    const model = document.getElementById("model").value;
    const principal = parseFloat(document.getElementById("principal").value);
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;
     const pin = document.getElementById("pin").value;
    const interest = parseFloat(document.getElementById("amount").value); // ดอกเบี้ยที่คำนวณแล้ว


    // ถ้าเลือก "อื่นๆ" ใน dropdown, ให้ใช้ค่าจาก input field
    if (brand === 'Other') {
        brand = document.getElementById('brand-other').value;
    }
       // คำนวณ dueDate (7 วันหลังจาก startDate)
    let [startDay, startMonth, startYear] = startDate.split("/");
    let startDateObj = new Date(startYear, startMonth - 1, startDay);
    startDateObj.setDate(startDateObj.getDate() + 7);
    const dueDate = flatpickr.formatDate(startDateObj, "d/m/Y"); // แปลงกลับเป็น string

    // ตรวจสอบข้อมูล (validation)
    if (!customerName || !brand || !model || isNaN(principal) || !startDate) {
        Swal.fire({ // ใช้ SweetAlert2
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        });
        return;
    }

    // เรียกฟังก์ชันเพิ่มข้อมูล
    // เรียก addPawnItem *พร้อมส่งสถานะเริ่มต้น*
    addPawnItem(customerName, brand, model, principal, interest, startDate, dueDate, pin, "กำลังจำนำ"); // dueDate ถูกส่งเข้าไปด้วย

    // ล้างค่าในฟอร์ม
    document.getElementById("customer-name").value = "";
    document.getElementById("brand").value = "";
    document.getElementById('brand-other').value = "";
    document.getElementById('brand-other').style.display = 'none'; // ซ่อน input "อื่นๆ"
    document.getElementById("model").value = "";
    document.getElementById("principal").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("start-date").value = "";
    document.getElementById("end-date").value = "";
    document.getElementById("pin").value = "";


}
// ---
// ฟังก์ชันส่งข้อมูลไป Google Sheet (เหมือนเดิม)
function sendToGoogleSheet(item, rowIndex = null) {
  const sheetUrl = 'https://script.google.com/macros/s/AKfycbyscE5X80XfCbcHKOEadaubNBjvMReETEOrjyXQTatXSZWBRiG1uoxlqmzJC13hALeS/exec'; // *** แทนที่ด้วย URL ของ Web app ***

   let formData = new FormData();
    formData.append('action', rowIndex ? 'update' : 'add'); // เพิ่ม action
    if (rowIndex) {
        formData.append('row', rowIndex); //  เพิ่ม row สำหรับ update
    }

  for (let key in item) {
      // แปลง Date object เป็น string ก่อนส่ง
        if (item[key] instanceof Date) {
            formData.append(key, item[key].toISOString());

        }else{
          formData.append(key, item[key]);
        }
  }

  fetch(sheetUrl, {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    console.log('Data sent to Google Sheet:', data);
      if (!rowIndex) { // ถ้าเป็นการเพิ่ม (ไม่ใช่แก้ไข)
            Swal.fire('บันทึกข้อมูลเรียบร้อยแล้ว', '', 'success');
        }
    // Swal.fire('บันทึกข้อมูลเรียบร้อยแล้ว', '', 'success'); // ย้ายไปอยู่ใน .then
  })
  .catch(error => {
    console.error('Error sending data to Google Sheet:', error);
    Swal.fire({ // ใช้ SweetAlert2
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'เกิดข้อผิดพลาดในการส่งข้อมูล: ' + error.message,
    });
  });
}

