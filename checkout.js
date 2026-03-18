// Load Car Data from URL
const urlParams = new URLSearchParams(window.location.search);
const carId = urlParams.get('id');
const carNameFromUrl = urlParams.get('name');
const carPrice = parseInt(urlParams.get('price')) || 0;
const carImg = urlParams.get('img');
const carType = urlParams.get('type') || 'SUV';

document.getElementById('carName').innerText = carNameFromUrl || "Select a car";
document.getElementById('carImg').src = carImg || 'https://images.unsplash.com/photo-1494055759057-a2f2f767a6fa?w=800&q=80';
document.getElementById('carType').innerText = carType;
document.getElementById('pricePerDay').innerText = `₹${carPrice.toLocaleString('en-IN')}`;

const pickupInput = document.getElementById('pickupDate');
const returnInput = document.getElementById('returnDate');
const daysInput = document.getElementById('days');
const totalAmountEl = document.getElementById('totalAmount');
const durationDisplayEl = document.getElementById('durationDisplay');
const dateRangeDisplayEl = document.getElementById('dateRangeDisplay');
const payBtn = document.getElementById('payBtn');
const statusMsg = document.getElementById('paymentStatusMsg');

// Set default dates
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

pickupInput.value = today.toISOString().split('T')[0];
returnInput.value = tomorrow.toISOString().split('T')[0];

function updateTotals() {
    const start = new Date(pickupInput.value);
    const end = new Date(returnInput.value);
    
    let days = 1;
    if (end > start) {
        const diffTime = Math.abs(end - start);
        days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else if (pickupInput.value && returnInput.value) {
        // If return is before pickup, reset return to pickup + 1
        const newReturn = new Date(start);
        newReturn.setDate(newReturn.getDate() + 1);
        returnInput.value = newReturn.toISOString().split('T')[0];
        days = 1;
    }
    
    daysInput.value = days;
    const total = carPrice * days;
    
    totalAmountEl.innerText = `₹${total.toLocaleString('en-IN')}`;
    durationDisplayEl.innerText = `${days} Day${days > 1 ? 's' : ''}`;
    
    // Show date range: eg. 01/01/2026 to 02/01/2026
    const formatDate = (d) => {
        const dt = new Date(d);
        return dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
    };
    dateRangeDisplayEl.innerHTML = `<span>${formatDate(pickupInput.value)}</span> <span style="margin: 0 8px; color: #94a3b8;">to</span> <span>${formatDate(returnInput.value)}</span>`;
    
    if (total === 0) {
        payBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Complete Booking';
        payBtn.className = 'btn-premium btn-book';
        statusMsg.innerHTML = 'This vehicle is currently available for <b>Complimentary Booking</b>. No payment required.';
    } else {
        payBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Proceed to Pay';
        payBtn.className = 'btn-premium btn-pay';
        statusMsg.innerHTML = 'Our payment system is currently prioritizing <b>Secure UP/Card</b> transactions for your safety.';
    }
}

pickupInput.addEventListener('change', updateTotals);
returnInput.addEventListener('change', updateTotals);
updateTotals();

// Handle Form Submission
document.getElementById('bookingForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert('Please sign in to continue with your booking.');
        window.location.href = 'login.html';
        return;
    }

    const origin = document.getElementById('origin').value;
    const dest = document.getElementById('destination').value;
    const days = daysInput.value;
    const total = carPrice * days;

    // Simple Animation State
    payBtn.disabled = true;
    payBtn.innerText = 'Processing...';

    setTimeout(() => {
        const bookingMsg = total === 0 ? 
            `Success! Your booking for ${carNameFromUrl} is confirmed.` : 
            `Transaction Successful! ₹${total.toLocaleString('en-IN')} paid for ${carNameFromUrl}.`;

        alert(bookingMsg);

        // Notification with Reverse Renting link
        const handoverUrl = `browsecar.html?mode=handover&car=${encodeURIComponent(carNameFromUrl)}&prefill=true&origin=${encodeURIComponent(origin)}&dest=${encodeURIComponent(dest)}`;
        
        addNotification(
            `Trip Confirmed: ${carNameFromUrl} for ${days} days. Want to save money on your return? <a href="${handoverUrl}" style="color: #2563eb; font-weight: 700; text-decoration: underline;">List for Reverse Renting</a>`, 
            'booking', 
            'profile.html'
        );

        window.location.href = 'profile.html';
    }, 1200);
});
