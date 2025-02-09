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

    const startDate = new Date(`<span class="math-inline">\{startYear\}\-</span>{startMonth}-${startDay}`);
    const endDate = new Date(`<span class="math-inline">\{endYear\}\-</span>{endMonth}-${endDay}`);

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

    let weekCount = 0;

    while (currentDate <= endDate) {
        currentDate.setDate(currentDate.getDate() + 7);
        weekCount++;
    }

    let daysRemaining = Math.floor((endDate - (currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)) / (1000 * 60 * 60 * 24));

    // สร้าง string วันที่ (สัปดาห์)
    let weekText = "";
    if (weekCount - 1 > 0) {
        weekText = `${formatDateThai(startDate)} = สัปดาห์ ที่ 1\n`;
    }

    // สร้าง string วันที่ (วันคงเหลือ)
    let daysText = "";
    if (daysRemaining > 0) {
        daysText = `${formatDateThai(endDate)} = ${daysRemaining} วัน\n`;
    }

    // คำนวณ
    let totalAmount = (weekCount - 1) * amount;
    let weekAmountText = ` ${amount.toFixed(2)} x ${weekCount - 1} สัปดาห์ = ${totalAmount.toFixed(2)} บาท\n`;

    let remainingAmount = 0;
    let remainingAmountText = "";
    if (daysRemaining > 0) {
        const dailyAmount = amount / 7;
        remainingAmount = dailyAmount * daysRemaining;
        totalAmount += remainingAmount;
        remainingAmountText = `(${amount.toFixed(2)} ÷ 7 วัน) x ${daysRemaining} วัน = ${remainingAmount.toFixed(2)} บาท\n`;
    }

    let totalAmountText = `รวมเป็นเงิน ${totalAmount.toFixed(2)} บาท`;

    result = weekText + daysText + weekAmountText + remainingAmountText + totalAmountText
    Swal.fire({
        icon: 'success',
        title: 'ผลการคำนวณ',
        html: result.split('\n').join('<br>'),
        customClass: {  // เพิ่ม customClass
            popup: 'text-left'
        }
    });
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
        status: status, // เพิ่ม status
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
    let cell8 = newRow.insertCell(7); // status
    let cell9 = newRow.insertCell(8); // Actions (Edit, Delete)

    // ใส่ข้อมูลลงใน cell
    cell1.innerHTML = item.customerName;
    cell2.innerHTML = item.brand;
    cell3.innerHTML = item.model;
    cell4.innerHTML = item.principal;
    cell5.innerHTML = item.interestRate;
    cell6.innerHTML = item.startDate;
    cell7.innerHTML = item.dueDate;
    // กำหนด class ตามสถานะ
    cell8.innerHTML = `<span class="status-<span class="math-inline">\{item\.status\.toLowerCase\(\)\.replace\(/ /g, '\-'\)\}"\></span>{item.status}</span>`;
    cell9.innerHTML = `
        <button class="action-button edit-button" onclick="editPawnItem(<span class="math-inline">\{pawnData\.length \- 1\}\)"\>Edit</button\>
<button class\="action\-button delete\-button" onclick\="deletePawnItem\(</span>{pawnData.length - 1})">Delete</button>
    `;
}
// ---
// --- ฟังก์ชันแสดง modal แก้ไข (Edit) ---
function editPawnItem(index) {
    const item = pawnData[index];

    // สร้าง dropdown สำหรับสถานะ
    const statusOptions = ['กำลังจำนำ', 'ไถ่ถอนแล้ว', 'หมดอายุ'].map(status => {
        const isSelected = status === item.status ? 'selected' : '';
        return `<option value="${status}" <span class="math-inline">\{isSelected\}\></span>{status}</option>`;
    }).join('');


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
            const status = document.getElementById('edit-status').value;



            // ตรวจสอบข้อมูล
            if (!customerName || !brand || !model || isNaN(principal) || !startDate) {
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
                dueDate: endDate,
                pin,
                status,
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

// --- ฟังก์ชันอัปเดตตารางหลังแก้ไข ---
function updateTableAfterEdit(index, item) {
    const table = document.getElementById("pawn-table").getElementsByTagName('tbody')[0];
    const row = table.rows[index];

    // อัปเดต cell ต่างๆ
    row.cells[0].innerHTML = item.customerName;
    row.cells[1].innerHTML = item.brand;
    row.cells[2].innerHTML = item.model;
    row.cells[3].innerHTML = item.principal;
    row.cells[4].innerHTML = item.interestRate;
    row.cells[5].innerHTML = item.startDate;
    row.cells[6].innerHTML = item.dueDate;
    row.cells[7].innerHTML = `<span class="status-<span class="math-inline">\{item\.status\.toLowerCase\(\)\.replace\(/ /g, '\-'\)\}"\></span>{item.status}</span>`;
    row.cells[8].innerHTML = `
        <button class="action-button edit-button" onclick="editPawnItem(<span class="math-inline">\{index\}\)"\>Edit</button\>
<button class\="action\-button delete\-button" onclick\="deletePawnItem\(</span>{index})">Delete</button>
    `; // อัปเดตปุ่ม (เผื่อกรณีมีการเปลี่ยน index)

}
// ---

// --- ฟังก์ชันลบรายการจำนำ ---
function deletePawnItem(index) {
    Swal.fire({
        title: 'คุณแน่ใจหรือไม่?',
        text: "คุณจะไม่สามารถกู้คืนรายการนี้ได้!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'ใช่, ลบเลย!',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            // ลบออกจาก pawnData array
            pawnData.splice(index, 1);

            // ลบออกจากตาราง
            const table = document.getElementById("pawn-table").getElementsByTagName('tbody')[0];
            table.deleteRow(index);

            // ส่งคำขอลบไป Google Sheet
            deleteFromGoogleSheet(index + 1); // +1 เพราะ row ใน Sheet เริ่มที่ 1

            Swal.fire(
                'ลบแล้ว!',
                'รายการของคุณถูกลบแล้ว',
                'success'
            )
        }
    })
}
// ---

// --- ฟังก์ชันลบข้อมูลจาก Google Sheet ---
function deleteFromGoogleSheet(rowIndex) {
    const sheetUrl = 'https://script.google.com/macros/s/AKfycbyscE5X80XfCbcHKOEadaubNBjvMReETEOrjyXQTatXSZWBRiG1uoxlqmzJC13hALeS/exec'; // URL เดิม
    fetch(sheetUrl + '?action=delete&row=' + rowIndex, { // เพิ่ม query parameters
        method: 'GET', // ใช้ GET สำหรับการลบ

    })
        .then(response => response.json())
        .then(data => {
            console.log('Data deleted from Google Sheet:', data);

        })
        .catch(error => {
            console.error('Error deleting data from Google Sheet:', error);
            alert('เกิดข้อผิดพลาดในการลบข้อมูล: ' + error.message);
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
    let brand = document.getElementById("brand").value;
    const model = document.getElementById("model").value;
    const principal = parseFloat(document.getElementById("principal").value);
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;  // ไม่ต้องคำนวณ End Date ตรงนี้
    const pin = document.getElementById("pin").value;
    const interest = parseFloat(document.getElementById("amount").value);

    if (brand === 'Other') {
        brand = document.getElementById('brand-other').value;
    }

    // *ไม่จำเป็นต้องคำนวณ dueDate ตรงนี้แล้ว*
    // let [startDay, startMonth, startYear] = startDate.split("/");
    // let startDateObj = new Date(startYear, startMonth - 1, startDay);
    // startDateObj.setDate(startDateObj.getDate() + 7);
    // const dueDate = flatpickr.formatDate(startDateObj, "d/m/Y");

    if (!customerName || !brand || !model || isNaN(principal) || !startDate) {
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        });
        return;
    }

    // เรียก addPawnItem พร้อมส่งสถานะเริ่มต้น, *ไม่ส่ง dueDate*
    addPawnItem(customerName, brand, model, principal, interest, startDate, endDate, pin, "กำลังจำนำ");

    // ล้างค่าในฟอร์ม
    document.getElementById("customer-name").value = "";
    document.getElementById("brand").value = "";
    document.getElementById('brand-other').value = "";
    document.getElementById('brand-other').style.display = 'none';
    document.getElementById("model").value = "";
    document.getElementById("principal").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("start-date").value = "";
    document.getElementById("end-date").value = "";
    document.getElementById("pin").value = "";
}
// ---

// --- ฟังก์ชันส่งข้อมูลไป Google Sheet (แก้ไข) ---
function sendToGoogleSheet(item, rowIndex = null) {
    const sheetUrl = 'https://script.google.com/macros/s/AKfycbyscE5X80XfCbcHKOEadaubNBjvMReETEOrjyXQTatXSZWBRiG1uoxlqmzJC13hALeS/exec';

    let formData = new FormData();
    formData.append('action', rowIndex ? 'update' : 'add');
    if (rowIndex) {
        formData.append('row', rowIndex);
    }

    for (let key in item) {
        // *ไม่ส่ง timestamp ไป Google Sheets*
        if (key !== 'timestamp') {
             if (item[key] instanceof Date) {
                formData.append(key, item[key].toISOString()); // ไม่ต้องแปลงเอง
            }else{
                formData.append(key, item[key]);
            }

        }
    }

    fetch(sheetUrl, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Data sent to Google Sheet:', data);
        if (!rowIndex) {
            Swal.fire('บันทึกข้อมูลเรียบร้อยแล้ว', '', 'success');
        }
    })
    .catch(error => {
        console.error('Error sending data to Google Sheet:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'เกิดข้อผิดพลาดในการส่งข้อมูล: ' + error.message,
        });
    });
}
// ---

// --- ฟังก์ชันค้นหา (เหมือนเดิม) ---
function searchTable() {
    const input = document.getElementById("search-input");
    const filter = input.value.toUpperCase();
    const table = document.getElementById("pawn-table");
    const tr = table.getElementsByTagName("tr");

    for (let i = 1; i < tr.length; i++) {
        let visible = false;
        const tds = tr[i].getElementsByTagName("td");
        for (let j = 0; j < tds.length; j++) {
            const cell = tds[j];
            if (cell) {
                const textValue = cell.textContent || cell.innerText;
                if (textValue.toUpperCase().indexOf(filter) > -1) {
                    visible = true;
                    break;
                }
            }
        }
        tr[i].style.display = visible ? "" : "none";
    }
}
// ---

// --- ส่วนจัดการ dropdown ยี่ห้อ (เหมือนเดิม) ---
document.getElementById('brand').addEventListener('change', function() {
    const otherInput = document.getElementById('brand-other');
    if (this.value === 'Other') {
        otherInput.style.display = 'block';
        otherInput.focus();
    } else {
        otherInput.style.display = 'none';
    }
});