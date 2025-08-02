// Translations
const translations = {
    th: {
        pageTitle: "PM Schedule Dashboard",
        today: "วันนี้",
        week: "สัปดาห์",
        month: "เดือน",
        language: "ภาษา:",
        noSchedule: "🎉 ไม่มีตารางงาน PM วันนี้",
        enjoyDay: "ขอให้มีความสุขกับวันหยุด!",
        time: "เวลา:",
        team: "ทีม:",
        coach: "โค้ช:",
        status: "สถานะ:",
        completed: "เสร็จสิ้น",
        pending: "รอดำเนินการ",
        done: "✓ เสร็จสิ้น",
        close: "ปิด",
        notSpecified: "ไม่ระบุ",
        noScheduleDay: "ไม่มีงาน",
        resetAll: "🔄 รีเซ็ททั้งหมด",
        confirmReset: "ต้องการรีเซ็ทสถานะทั้งหมดหรือไม่?",
        online: "🟢 เชื่อมต่อแล้ว",
        offline: "🔴 ออฟไลน์",
        sun: "อา",
        mon: "จ",
        tue: "อ",
        wed: "พ",
        thu: "พฤ",
        fri: "ศ",
        sat: "ส",
        sunday: "อาทิตย์",
        monday: "จันทร์",
        tuesday: "อังคาร",
        wednesday: "พุธ",
        thursday: "พฤหัสบดี",
        friday: "ศุกร์",
        saturday: "เสาร์",
        january: "มกราคม",
        february: "กุมภาพันธ์",
        march: "มีนาคม",
        april: "เมษายน",
        may: "พฤษภาคม",
        june: "มิถุนายน",
        july: "กรกฎาคม",
        august: "สิงหาคม",
        september: "กันยายน",
        october: "ตุลาคม",
        november: "พฤศจิกายน",
        december: "ธันวาคม"
    },
    en: {
        pageTitle: "PM Schedule Dashboard",
        today: "Today",
        week: "Week",
        month: "Month",
        language: "Language:",
        noSchedule: "🎉 No PM Schedule Today",
        enjoyDay: "Enjoy your day off!",
        time: "Time:",
        team: "Team:",
        coach: "Coach:",
        status: "Status:",
        completed: "Completed",
        pending: "Pending",
        done: "✓ Done",
        close: "Close",
        notSpecified: "Not specified",
        noScheduleDay: "No Schedule",
        resetAll: "🔄 Reset All",
        confirmReset: "Do you want to reset all status?",
        online: "🟢 Online",
        offline: "🔴 Offline",
        sun: "Sun",
        mon: "Mon",
        tue: "Tue",
        wed: "Wed",
        thu: "Thu",
        fri: "Fri",
        sat: "Sat",
        sunday: "Sunday",
        monday: "Monday",
        tuesday: "Tuesday",
        wednesday: "Wednesday",
        thursday: "Thursday",
        friday: "Friday",
        saturday: "Saturday",
        january: "January",
        february: "February",
        march: "March",
        april: "April",
        may: "May",
        june: "June",
        july: "July",
        august: "August",
        september: "September",
        october: "October",
        november: "November",
        december: "December"
    }
};

// Firebase Manager Class
class FirebaseManager {
    constructor() {
        this.isAvailable = false;
        try {
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                this.db = firebase.firestore();
                this.vehicleStatusRef = this.db.collection('vehicleStatus');
                this.isAvailable = true;
                console.log('Firebase Manager initialized successfully');
            } else {
                throw new Error('Firebase not available');
            }
        } catch (error) {
            console.warn('Firebase initialization failed:', error);
            this.isAvailable = false;
        }
    }

    // บันทึกสถานะรถ
    async saveVehicleStatus(vehicleNumber, status) {
        if (!this.isAvailable) {
            throw new Error('Firebase not available');
        }
        
        try {
            await this.vehicleStatusRef.doc(vehicleNumber).set({
                status: status,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                vehicleNumber: vehicleNumber
            });
            console.log('Status saved successfully for:', vehicleNumber);
        } catch (error) {
            console.error('Error saving status:', error);
            throw error;
        }
    }

    // โหลดสถานะรถทั้งหมด
    async loadAllVehicleStatus() {
        if (!this.isAvailable) {
            return new Set();
        }
        
        try {
            const snapshot = await this.vehicleStatusRef.where('status', '==', 'completed').get();
            const completedVehicles = new Set();
            
            snapshot.forEach(doc => {
                completedVehicles.add(doc.data().vehicleNumber);
            });
            
            console.log('Loaded completed vehicles:', completedVehicles.size);
            return completedVehicles;
        } catch (error) {
            console.error('Error loading status:', error);
            return new Set();
        }
    }

    // ฟังการเปลี่ยนแปลงแบบ real-time
    listenToStatusChanges(callback) {
        if (!this.isAvailable) {
            return null;
        }
        
        return this.vehicleStatusRef.where('status', '==', 'completed')
            .onSnapshot((snapshot) => {
                const completedVehicles = new Set();
                snapshot.forEach(doc => {
                    completedVehicles.add(doc.data().vehicleNumber);
                });
                callback(completedVehicles);
            }, (error) => {
                console.error('Error listening to changes:', error);
            });
    }

    // ลบสถานะรถ (สำหรับ reset)
    async resetVehicleStatus(vehicleNumber) {
        if (!this.isAvailable) {
            throw new Error('Firebase not available');
        }
        
        try {
            await this.vehicleStatusRef.doc(vehicleNumber).delete();
            console.log('Reset status for:', vehicleNumber);
        } catch (error) {
            console.error('Error resetting status:', error);
            throw error;
        }
    }

    // Reset สถานะทั้งหมด
    async resetAllStatus() {
        if (!this.isAvailable) {
            throw new Error('Firebase not available');
        }
        
        try {
            const snapshot = await this.vehicleStatusRef.get();
            const batch = this.db.batch();
            
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            console.log('All status reset successfully');
        } catch (error) {
            console.error('Error resetting all status:', error);
            throw error;
        }
    }
}

// Global variables
let completedVehicles = new Set();
let currentSelectedVehicle = null;
let currentView = 'today';
let currentLanguage = 'th';
let currentMonth = new Date(2025, 7); // สิงหาคม 2025 สำหรับ demo data
let firebaseManager = null;
let unsubscribe = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', async function() {
    updateConnectionStatus(false);
    
    // Initialize Firebase Manager
    try {
        firebaseManager = new FirebaseManager();
        
        if (firebaseManager.isAvailable) {
            // โหลดสถานะจาก Firebase
            completedVehicles = await firebaseManager.loadAllVehicleStatus();
            
            // ฟังการเปลี่ยนแปลงแบบ real-time
            unsubscribe = firebaseManager.listenToStatusChanges((newCompletedVehicles) => {
                completedVehicles = newCompletedVehicles;
                loadSchedule(); // รีเฟรชหน้าจอเมื่อมีการเปลี่ยนแปลง
            });
            
            updateConnectionStatus(true);
            console.log('Firebase connected successfully');
        } else {
            throw new Error('Firebase not available');
        }
    } catch (error) {
        console.warn('Using LocalStorage fallback:', error);
        firebaseManager = null;
        loadCompletedVehicles(); // ใช้ LocalStorage แทน
        updateConnectionStatus(false);
    }

    setupEventListeners();
    updateLanguage();
    updateCurrentDate();
    loadSchedule();
});

// Update connection status indicator
function updateConnectionStatus(isOnline) {
    const statusElement = document.getElementById('connectionStatus');
    const t = translations[currentLanguage];
    
    if (isOnline) {
        statusElement.className = 'connection-status online';
        statusElement.textContent = t.online;
    } else {
        statusElement.className = 'connection-status offline';
        statusElement.textContent = t.offline;
    }
}

// LocalStorage functions (fallback)
function saveCompletedVehicles() {
    localStorage.setItem('completedVehicles', JSON.stringify([...completedVehicles]));
}

function loadCompletedVehicles() {
    const saved = localStorage.getItem('completedVehicles');
    if (saved) {
        completedVehicles = new Set(JSON.parse(saved));
    }
}

function setupEventListeners() {
    // View buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            // Set current view
            currentView = this.getAttribute('data-view');
            
            // Load appropriate schedule
            loadSchedule();
        });
    });

    // Language toggle
    document.getElementById('langSwitch').addEventListener('click', function() {
        this.classList.toggle('en');
        currentLanguage = currentLanguage === 'th' ? 'en' : 'th';
        updateLanguage();
        updateConnectionStatus(firebaseManager && firebaseManager.isAvailable);
    });

    setupPopupEvents();
}

function updateLanguage() {
    const t = translations[currentLanguage];
    
    // Update static elements
    document.getElementById('pageTitle').textContent = t.pageTitle;
    document.getElementById('btnToday').textContent = t.today;
    document.getElementById('btnWeek').textContent = t.week;
    document.getElementById('btnMonth').textContent = t.month;
    document.getElementById('langLabel').textContent = t.language;
    document.getElementById('langText').textContent = currentLanguage.toUpperCase();
    document.getElementById('btnDone').textContent = t.done;
    document.getElementById('btnClose').textContent = t.close;
    document.getElementById('resetBtn').textContent = t.resetAll;

    // Update current date
    updateCurrentDate();
    
    // Reload schedule to apply language changes
    loadSchedule();
}

function updateCurrentDate() {
    const now = new Date();
    const t = translations[currentLanguage];
    
    let dateStr;
    if (currentLanguage === 'th') {
        const thaiDate = now.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        dateStr = thaiDate;
    } else {
        const englishDate = now.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        dateStr = englishDate;
    }
    
    document.getElementById('currentDate').textContent = dateStr;
}

function loadSchedule() {
    const container = document.getElementById('scheduleContainer');
    
    switch(currentView) {
        case 'today':
            loadTodaySchedule(container);
            break;
        case 'week':
            loadWeekSchedule(container);
            break;
        case 'month':
            loadMonthSchedule(container);
            break;
    }
}

function loadTodaySchedule(container) {
    // ใช้ข้อมูล demo (วันแรกที่มีข้อมูล)
    const todaySchedule = scheduleData.find(day => Object.keys(day).length > 2);
    
    if (!todaySchedule || Object.keys(todaySchedule).length <= 2) {
        const t = translations[currentLanguage];
        container.innerHTML = `
            <div class="no-schedule">
                <h2>${t.noSchedule}</h2>
                <p>${t.enjoyDay}</p>
            </div>
        `;
        return;
    }

    const scheduleGrid = document.createElement('div');
    scheduleGrid.className = 'schedule-grid';

    const timeSlots = Object.keys(todaySchedule).filter(key => 
        key !== 'Date' && key !== 'Day'
    );

    timeSlots.forEach(timeSlot => {
        const vehicleNumber = todaySchedule[timeSlot];
        const timeSlotDiv = createTimeSlotCard(timeSlot, vehicleNumber);
        scheduleGrid.appendChild(timeSlotDiv);
    });

    container.innerHTML = '';
    container.appendChild(scheduleGrid);
}

function loadWeekSchedule(container) {
    const weekView = document.createElement('div');
    weekView.className = 'week-view';

    const t = translations[currentLanguage];
    const dayNames = currentLanguage === 'th' 
        ? [t.sun, t.mon, t.tue, t.wed, t.thu, t.fri, t.sat]
        : [t.sun, t.mon, t.tue, t.wed, t.thu, t.fri, t.sat];

    // ใช้ข้อมูล demo สัปดาห์แรกของสิงหาคม 2025
    const startDate = new Date(2025, 7, 1); // 1 สิงหาคม 2025

    // สร้าง 7 วันในสัปดาห์
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        // สร้าง date string ในรูปแบบ MM/DD/YYYY
        const dateStr = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}/${currentDate.getFullYear()}`;
        const dayData = scheduleData.find(day => day.Date === dateStr);
        
        const dayDiv = document.createElement('div');
        dayDiv.className = 'week-day';
        
        const dayHeader = document.createElement('div');
        dayHeader.className = 'week-day-header';
        
        // แสดงชื่อวันและวันที่
        const dayName = dayNames[currentDate.getDay()];
        const dayNumber = currentDate.getDate();
        const monthName = currentLanguage === 'th' 
            ? getThaiMonthName(currentDate.getMonth())
            : getEnglishMonthName(currentDate.getMonth());
        
        dayHeader.innerHTML = `
            <div style="font-size: 1em; margin-bottom: 5px;">${dayName}</div>
            <div style="font-size: 0.9em; opacity: 0.8;">${dayNumber} ${monthName}</div>
        `;

        dayDiv.appendChild(dayHeader);

        // เพิ่มข้อมูลตารางงานถ้ามี
        if (dayData) {
            const timeSlots = Object.keys(dayData).filter(key => 
                key !== 'Date' && key !== 'Day'
            );

            timeSlots.forEach(timeSlot => {
                const vehicleNumber = dayData[timeSlot];
                const vehicleCard = createCompactVehicleCard(vehicleNumber, timeSlot);
                dayDiv.appendChild(vehicleCard);
            });
        } else {
            // แสดงข้อความเมื่อไม่มีตารางงาน
            const noScheduleDiv = document.createElement('div');
            noScheduleDiv.style.cssText = `
                text-align: center;
                color: #bdc3c7;
                font-style: italic;
                margin-top: 20px;
                padding: 20px;
            `;
            noScheduleDiv.textContent = t.noScheduleDay;
            dayDiv.appendChild(noScheduleDiv);
        }

        weekView.appendChild(dayDiv);
    }

    container.innerHTML = '';
    container.appendChild(weekView);
}

function loadMonthSchedule(container) {
    const monthView = document.createElement('div');
    monthView.className = 'month-view';

    // Month header with navigation
    const monthHeader = document.createElement('div');
    monthHeader.className = 'month-header';

    const monthNav = document.createElement('div');
    monthNav.className = 'month-nav';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'nav-btn';
    prevBtn.textContent = '‹ Previous';
    prevBtn.onclick = () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        loadMonthSchedule(container);
    };

    const nextBtn = document.createElement('button');
    nextBtn.className = 'nav-btn';
    nextBtn.textContent = 'Next ›';
    nextBtn.onclick = () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        loadMonthSchedule(container);
    };

    const monthTitle = document.createElement('h2');
    const t = translations[currentLanguage];
    const monthNames = currentLanguage === 'th' 
        ? [t.january, t.february, t.march, t.april, t.may, t.june, 
           t.july, t.august, t.september, t.october, t.november, t.december]
        : ['January', 'February', 'March', 'April', 'May', 'June',
           'July', 'August', 'September', 'October', 'November', 'December'];
    
    monthTitle.textContent = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

    monthNav.appendChild(prevBtn);
    monthNav.appendChild(nextBtn);
    monthHeader.appendChild(monthTitle);
    monthHeader.appendChild(monthNav);

    // Month grid
    const monthGrid = document.createElement('div');
    monthGrid.className = 'month-grid';

    // Day headers
    const dayNames = currentLanguage === 'th' 
        ? [t.sun, t.mon, t.tue, t.wed, t.thu, t.fri, t.sat]
        : [t.sun, t.mon, t.tue, t.wed, t.thu, t.fri, t.sat];

    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'month-day-header';
        dayHeader.textContent = day;
        monthGrid.appendChild(dayHeader);
    });

    // Calendar days
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        const dayDiv = document.createElement('div');
        dayDiv.className = 'month-day';

        const dayNumber = document.createElement('div');
        dayNumber.className = 'month-day-number';
        dayNumber.textContent = currentDate.getDate();

        if (currentDate.getMonth() !== currentMonth.getMonth()) {
            dayDiv.classList.add('other-month');
        }

        dayDiv.appendChild(dayNumber);

        // Add schedule data if available
        const dateStr = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}/${currentDate.getFullYear()}`;
        const dayData = scheduleData.find(day => day.Date === dateStr);

        if (dayData && currentDate.getMonth() === currentMonth.getMonth()) {
            const timeSlots = Object.keys(dayData).filter(key => 
                key !== 'Date' && key !== 'Day'
            );

            timeSlots.slice(0, 3).forEach(timeSlot => { // Show only first 3 slots
                const vehicleNumber = dayData[timeSlot];
                const vehicleCard = createCompactVehicleCard(vehicleNumber, timeSlot);
                dayDiv.appendChild(vehicleCard);
            });

            if (timeSlots.length > 3) {
                const moreDiv = document.createElement('div');
                moreDiv.style.cssText = 'font-size: 0.7em; color: #7f8c8d; text-align: center; margin-top: 2px;';
                moreDiv.textContent = `+${timeSlots.length - 3} more`;
                dayDiv.appendChild(moreDiv);
            }
        }

        monthGrid.appendChild(dayDiv);
    }

    monthView.appendChild(monthHeader);
    monthView.appendChild(monthGrid);

    container.innerHTML = '';
    container.appendChild(monthView);
}

// ฟังก์ชันช่วยสำหรับชื่อเดือนภาษาไทย
function getThaiMonthName(monthIndex) {
    const monthNames = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    return monthNames[monthIndex];
}

// ฟังก์ชันช่วยสำหรับชื่อเดือนภาษาอังกฤษ
function getEnglishMonthName(monthIndex) {
    const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return monthNames[monthIndex];
}

function createTimeSlotCard(timeSlot, vehicleNumber) {
    const timeSlotDiv = document.createElement('div');
    timeSlotDiv.className = 'time-slot';

    const timeLabel = document.createElement('div');
    timeLabel.className = 'time-label';
    timeLabel.textContent = timeSlot;

    const vehicleCard = document.createElement('div');
    vehicleCard.className = 'vehicle-card';
    vehicleCard.onclick = () => showVehicleDetails(vehicleNumber, timeSlot);

    if (completedVehicles.has(vehicleNumber)) {
        vehicleCard.classList.add('completed');
    }

    const vehicleNumberDiv = document.createElement('div');
    vehicleNumberDiv.className = 'vehicle-number';
    vehicleNumberDiv.textContent = vehicleNumber;

    const statusBadge = document.createElement('div');
    statusBadge.className = 'status-badge';
    const t = translations[currentLanguage];
    statusBadge.textContent = completedVehicles.has(vehicleNumber) ? t.completed : t.pending;

    vehicleCard.appendChild(vehicleNumberDiv);
    vehicleCard.appendChild(statusBadge);

    timeSlotDiv.appendChild(timeLabel);
    timeSlotDiv.appendChild(vehicleCard);

    return timeSlotDiv;
}

function createCompactVehicleCard(vehicleNumber, timeSlot) {
    const vehicleCard = document.createElement('div');
    vehicleCard.className = 'vehicle-card compact';
    vehicleCard.onclick = () => showVehicleDetails(vehicleNumber, timeSlot);

    if (completedVehicles.has(vehicleNumber)) {
        vehicleCard.classList.add('completed');
    }

    const vehicleNumberDiv = document.createElement('div');
    vehicleNumberDiv.className = 'vehicle-number';
    vehicleNumberDiv.textContent = vehicleNumber;

    const vehicleTimeDiv = document.createElement('div');
    vehicleTimeDiv.className = 'vehicle-time';
    vehicleTimeDiv.textContent = timeSlot;

    const statusBadge = document.createElement('div');
    statusBadge.className = 'status-badge';
    const t = translations[currentLanguage];
    statusBadge.textContent = completedVehicles.has(vehicleNumber) ? t.completed : t.pending;

    vehicleCard.appendChild(vehicleNumberDiv);
    vehicleCard.appendChild(vehicleTimeDiv);
    vehicleCard.appendChild(statusBadge);

    return vehicleCard;
}

function showVehicleDetails(vehicleNumber, timeSlot) {
    currentSelectedVehicle = { number: vehicleNumber, timeSlot: timeSlot };
    
    const details = pmDetails[vehicleNumber];
    if (!details) {
        alert('ไม่พบข้อมูลรถหมายเลข ' + vehicleNumber);
        return;
    }

    const t = translations[currentLanguage];

    // Update popup content
    document.getElementById('popupVehicleNumber').textContent = vehicleNumber;
    
    const popupDetails = document.getElementById('popupDetails');
    popupDetails.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">${t.time}</span>
            <span class="detail-value">${timeSlot}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">${t.team}</span>
            <span class="detail-value">${details.team || t.notSpecified}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">${t.coach}</span>
            <span class="detail-value">${details.coach || t.notSpecified}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">${t.status}</span>
            <span class="detail-value">${completedVehicles.has(vehicleNumber) ? t.completed : t.pending}</span>
        </div>
    `;

    // Show popup
    document.getElementById('popupOverlay').style.display = 'block';
}

function setupPopupEvents() {
    // Done button
    document.getElementById('btnDone').addEventListener('click', function() {
        if (currentSelectedVehicle) {
            markVehicleCompleted(currentSelectedVehicle.number);
            closePopup();
        }
    });

    // Close button
    document.getElementById('btnClose').addEventListener('click', closePopup);

    // Close on overlay click
    document.getElementById('popupOverlay').addEventListener('click', function(e) {
        if (e.target === this) {
            closePopup();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closePopup();
        }
    });
}

async function markVehicleCompleted(vehicleNumber) {
    completedVehicles.add(vehicleNumber);
    
    // บันทึกลง Firebase หรือ LocalStorage
    try {
        if (firebaseManager && firebaseManager.isAvailable) {
            await firebaseManager.saveVehicleStatus(vehicleNumber, 'completed');
        } else {
            saveCompletedVehicles();
        }
    } catch (error) {
        console.error('Error saving vehicle status:', error);
        // Fallback to localStorage
        saveCompletedVehicles();
    }
    
    // Reload current view to update colors
    loadSchedule();
}

// Reset ฟังก์ชัน
async function resetVehicleStatus(vehicleNumber) {
    completedVehicles.delete(vehicleNumber);
    
    try {
        if (firebaseManager && firebaseManager.isAvailable) {
            await firebaseManager.resetVehicleStatus(vehicleNumber);
        } else {
            saveCompletedVehicles();
        }
    } catch (error) {
        console.error('Error resetting vehicle status:', error);
        saveCompletedVehicles();
    }
    
    loadSchedule();
}

// Reset ทั้งหมด
async function resetAllStatus() {
    const t = translations[currentLanguage];
    if (confirm(t.confirmReset)) {
        completedVehicles.clear();
        
        try {
            if (firebaseManager && firebaseManager.isAvailable) {
                await firebaseManager.resetAllStatus();
            } else {
                saveCompletedVehicles();
            }
        } catch (error) {
            console.error('Error resetting all status:', error);
            saveCompletedVehicles();
        }
        
        loadSchedule();
    }
}

function closePopup() {
    document.getElementById('popupOverlay').style.display = 'none';
    currentSelectedVehicle = null;
}

// Cleanup เมื่อออกจากหน้า
window.addEventListener('beforeunload', () => {
    if (unsubscribe) {
        unsubscribe();
    }
});

// Export functions for global access
window.resetAllStatus = resetAllStatus;
window.resetVehicleStatus = resetVehicleStatus;
