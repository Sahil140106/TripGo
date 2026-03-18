let allBookings = [];

async function fetchUserBookings() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    try {
        const response = await fetch(`${BOOKING_API_URL}/user/${user.id}`);
        if (response.ok) {
            allBookings = await response.json();
            
            // Map to include car details for rendering
            const carsRes = await fetch(`${CAR_API_URL}/all`);
            if (carsRes.ok) {
                const allCars = await carsRes.json();
                const carMap = {};
                allCars.forEach(c => carMap[c.id] = c);
                
                allBookings = allBookings.map(b => ({
                    ...b,
                    car: (carMap[b.carId] || {}).name || "Unknown Car",
                    image: (carMap[b.carId] || {}).imageUrl || "https://images.unsplash.com/photo-1494055759057-a2f2f767a6fa?w=800&q=80",
                    dates: `${b.startDate} → ${b.endDate}`,
                    total: `₹${(b.totalAmount || 0).toLocaleString('en-IN')}`
                }));
            }
            
            filterBookings(); // This will trigger renderBookings
        }
    } catch (err) {
        console.error("Fetch bookings error:", err);
    }
}

const bookingsGrid = document.getElementById('bookingsGrid');
const statusFilter = document.getElementById('statusFilter');

function openBookingModal(booking) {
    document.getElementById('modalCarImage').src = booking.image;
    document.getElementById('modalCar').textContent = booking.car;
    document.getElementById('modalDates').textContent = booking.dates;
    document.getElementById('modalTotal').textContent = booking.total;
    
    const statusElement = document.getElementById('modalStatus');
    statusElement.textContent = booking.status;
    statusElement.className = `detail-value status ${booking.status.toLowerCase()}`;
    
    document.getElementById('bookingModalOverlay').classList.add('active');
}

function closeBookingModal() {
    document.getElementById('bookingModalOverlay').classList.remove('active');
}

function renderBookings(bookingsToRender) {
    if (bookingsToRender.length === 0) {
        bookingsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 48px; margin-bottom: 20px;">📭</div>
                <h3 style="color: var(--text-main); margin-bottom: 10px; font-size: 20px;">No Bookings Found</h3>
                <p style="color: var(--text-sub); margin: 0; margin-bottom: 25px; line-height: 1.6;">There are no bookings matching your filter. Browse cars and make a new booking!</p>
                <a href="browsecar.html" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; transition: all 0.2s ease;">Browse Cars</a>
            </div>
        `;
        return;
    }

    bookingsGrid.innerHTML = bookingsToRender.map(booking => `
        <div class="booking-card" onclick="openBookingModal({car: '${booking.car}', dates: '${booking.dates}', total: '${booking.total}', status: '${booking.status}', image: '${booking.image}'})">
            <img src="${booking.image}" alt="${booking.car}" class="booking-card-image">
            <div class="booking-card-header">
                <h3 class="booking-card-title">${booking.car}</h3>
                <p class="booking-card-dates"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg> ${booking.dates}</p>
            </div>
            <div class="booking-card-body">
                <div class="booking-info-row">
                    <span class="booking-info-label">Total Amount</span>
                    <span class="booking-info-value booking-info-amount">${booking.total}</span>
                </div>
                <div class="booking-info-row">
                    <span class="booking-info-label">Status</span>
                    <span class="booking-status-badge ${booking.status.toLowerCase()}">${booking.status}</span>
                </div>
            </div>
            <div class="booking-card-footer">
                <button class="booking-card-btn primary">View Details</button>
                <button class="booking-card-btn secondary">Contact</button>
            </div>
        </div>
    `).join('');
}

function filterBookings() {
    const selectedStatus = statusFilter.value;
    
    if (selectedStatus === 'all') {
        renderBookings(allBookings);
    } else {
        const filtered = allBookings.filter(booking => booking.status.toLowerCase() === selectedStatus);
        renderBookings(filtered);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    renderBookings(allBookings);
    
    statusFilter.addEventListener('change', filterBookings);
    
    const closeBtn = document.getElementById('closeBookingModal');
    const modalOverlay = document.getElementById('bookingModalOverlay');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeBookingModal);
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(event) {
            if (event.target === modalOverlay) {
                closeBookingModal();
            }
        });
    }
});
