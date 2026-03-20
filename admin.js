// admin.js - Admin Dashboard Logic

let myVehicles = [];
let allBookings = [];
let allUsers = [];
let allPayments = [];
let carMap = {};
let activeHandovers = [];
let currentActiveVehicle = null;

// --- Profile Helpers ---
function generateInitials(name) {
    if (!name || typeof name !== 'string') return "A";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return "A";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function updateAllProfileIcons() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;
    const initials = generateInitials(user.fullName || "Admin");
    const avatars = document.querySelectorAll('.profile-avatar, #profileAvatar');
    
    avatars.forEach(avatar => {
        // Preserving edit icon if it exists in the original HTML structure
        const hasEditId = avatar.id === 'profileAvatar';
        const editIconHTML = hasEditId ? `
            <div class="avatar-edit-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </div>` : '';

        if (user.profilePic) {
            avatar.innerHTML = `<img src="${user.profilePic}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">${editIconHTML}`;
        } else {
            avatar.innerHTML = `${initials}${editIconHTML}`;
        }
    });

    const nameEl = document.getElementById('userName');
    if (nameEl) nameEl.textContent = user.fullName || "Admin Panel";
}

function initProfilePicChange() {
    const avatar = document.getElementById('profileAvatar');
    const fileInput = document.getElementById('change-pic-input');

    console.log("Profile Pic Init: avatar exists?", !!avatar, "input exists?", !!fileInput);

    if (avatar && fileInput) {
        avatar.style.cursor = 'pointer';
        avatar.addEventListener('click', () => {
            console.log("Avatar clicked, triggering file input...");
            fileInput.click();
        });

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            console.log("File selected:", file ? file.name : "none");
            if (!file) return;

            if (file.size > 10 * 1024 * 1024) {
                alert('Image size should be less than 10MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64 = event.target.result;
                const user = JSON.parse(localStorage.getItem('user'));
                console.log("Updating profile pic for:", user ? user.email : "UNKNOWN USER");
                
                if (!user || !user.email) {
                    alert("Error: User session information is missing. Please log in again.");
                    return;
                }

                try {
                    console.log("Sending request to:", `${API_BASE_URL}/auth/update-profile-pic`);
                    const response = await fetch(`${API_BASE_URL}/auth/update-profile-pic`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: user.email,
                            role: user.role || 'ADMIN',
                            profilePic: base64
                        })
                    });

                    if (response.ok) {
                        console.log("Profile pic update SUCCESS");
                        user.profilePic = base64;
                        localStorage.setItem('user', JSON.stringify(user));
                        updateAllProfileIcons();
                        alert('Profile picture updated successfully!');
                    } else {
                        const errorText = await response.text();
                        console.error("Profile pic update FAILED:", response.status, errorText);
                        alert(`Failed to update profile picture: ${errorText}`);
                    }
                } catch (err) {
                    console.error("Profile pic update NETWORK ERROR:", err);
                    alert('An error occurred during network request. Please check if backend is running.');
                }
            };
            reader.readAsDataURL(file);
        });
    }
}

let notificationInterval = null;

function initNotifications() {
    const notifBtn = document.getElementById('notificationBtn');
    const notifDropdown = document.getElementById('notificationDropdown');
    const markReadBtn = document.getElementById('markAllRead');

    if (notifBtn && notifDropdown) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifDropdown.style.display = notifDropdown.style.display === 'block' ? 'none' : 'block';
        });

        document.addEventListener('click', () => {
            notifDropdown.style.display = 'none';
        });

        notifDropdown.addEventListener('click', (e) => e.stopPropagation());
    }

    if (markReadBtn) {
        markReadBtn.addEventListener('click', async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                const res = await fetch(`${API_BASE_URL}/messages/renter/${user.id || 1}`);
                if (res.ok) {
                    const messages = await res.json();
                    const unread = messages.filter(m => !m.read);
                    for (const m of unread) {
                        await fetch(`${API_BASE_URL}/messages/${m.id}/read`, { method: 'PATCH' });
                    }
                    fetchMessages();
                }
            } catch (err) { console.error("Mark all read error:", err); }
        });
    }

    fetchMessages();
    if (notificationInterval) clearInterval(notificationInterval);
    notificationInterval = setInterval(fetchMessages, 15000);
}

async function fetchMessages() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch(`${API_BASE_URL}/messages/user/${user.id}`);
        if (response.ok) {
            const messages = await response.json();
            updateNotificationBadge(messages);
            renderNotificationDropdown(messages);
        }
    } catch (err) { console.error("Fetch messages error:", err); }
}

function updateNotificationBadge(messages) {
    const badge = document.getElementById('notifBadge');
    if (!badge) return;
    const unreadCount = messages.filter(m => !m.read).length;
    if (unreadCount > 0) {
        badge.innerText = unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function renderNotificationDropdown(messages) {
    const list = document.getElementById('notificationList');
    if (!list) return;

    if (messages.length === 0) {
        list.innerHTML = '<div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">No new notifications</div>';
        return;
    }
    list.innerHTML = messages.slice(0, 8).map(m => {
        let title = "System Update";
        let icon = "🔔";
        if (m.type === 'CONFIRMATION') { title = "Booking Confirmed"; icon = "✅"; }
        if (m.type === 'NEW_BOOKING') { title = "New Car Booking"; icon = "🚗"; }
        if (m.type === 'HANDOVER' || m.type === 'HANDOVER_INITIATED') { title = "Handover Request"; icon = "🤝"; }
        if (m.type === 'HANDOVER_ACCEPTED') { title = "Handover Accepted"; icon = "🤝"; }
        if (m.type === 'CAR_DELETED') { title = "Car Listing Removed"; icon = "🗑️"; }
        if (m.type === 'CANCELLED') { title = "Booking Cancelled"; icon = "❌"; }
        if (m.type === 'EARLY_END_REQUEST') { title = "Early Return Request"; icon = "⏳"; }
        if (m.type === 'EARLY_END_REJECTED') { title = "Request Rejected"; icon = "❌"; }

        const status = m.status || 'PENDING';

        return `
            <div style="padding: 12px 15px; border-bottom: 1px solid #f1f5f9; cursor: pointer; background: ${m.read ? 'white' : '#f0f7ff'};" onclick="event.stopPropagation();">
                <div style="display: flex; gap: 12px;">
                    <div style="font-size: 18px;">${icon}</div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <p style="margin: 0; font-size: 13px; font-weight: 600; color: #1e293b;">${title}</p>
                            ${status !== 'PENDING' ? `<span style="font-size: 10px; font-weight: 700; color: ${status === 'ACCEPTED' ? '#10b981' : '#ef4444'}; text-transform: uppercase;">${status}</span>` : ''}
                        </div>
                        <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.4;">${m.carName || 'Notification'}</p>
                        <small style="color: #94a3b8; font-size: 10px;">${new Date(m.timestamp).toLocaleString()}</small>
                        
                        ${status === 'PENDING' && m.type === 'EARLY_END_REQUEST' ? `
                            <div style="display: flex; gap: 10px; margin-top: 8px;">
                                <button onclick="handleRequestAction(${m.bookingId}, '${m.endDate}', 'approve')" style="flex: 1; padding: 5px; font-size: 11px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">Accept</button>
                                <button onclick="handleRequestAction(${m.bookingId}, '${m.endDate}', 'reject')" style="flex: 1; padding: 5px; font-size: 11px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">Reject</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function handleRequestAction(bookingId, newEndDate, action) {
    console.log(`Admin action: ${action} for booking ${bookingId}`);
    try {
        const endpoint = action === 'approve' ? 'approve-early-completion' : 'reject-early-completion';
        const url = `${API_BASE_URL}/bookings/${bookingId}/${endpoint}?newEndDate=${newEndDate}`;
        
        const response = await fetch(url, { method: 'POST' });
        if (response.ok) {
            alert(`Request ${action === 'approve' ? 'Accepted' : 'Rejected'} successfully!`);
            fetchMessages(); // Refresh UI
            fetchDashboardStats();
        } else {
            const err = await response.text();
            alert("Action failed: " + err);
        }
    } catch (err) {
        console.error("Action error:", err);
        alert("An error occurred.");
    }
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// --- Admin Stats Logic ---

async function fetchDashboardStats() {
    try {
        console.log("Admin Dashboard: Fetching data started...");
        
        // Parallel fetching for speed
        const [usersRes, carsRes, bookingsRes, paymentsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/auth/users`),
            fetch(`${API_BASE_URL}/cars`),
            fetch(`${API_BASE_URL}/bookings`),
            fetch(`${API_BASE_URL}/payments`)
        ]);

        if (usersRes.ok) allUsers = await usersRes.json();
        if (carsRes.ok) {
            myVehicles = await carsRes.json();
            carMap = {}; // Reset and rebuild
            myVehicles.forEach(c => carMap[c.id] = c);
        }
        if (bookingsRes.ok) allBookings = await bookingsRes.json();
        if (paymentsRes.ok) allPayments = await paymentsRes.json();

        // 5. Fetch Handovers for dashboard
        try {
            const handoversRes = await fetch(`${API_BASE_URL}/handovers`);
            if (handoversRes.ok) {
                activeHandovers = await handoversRes.json();
                renderRecentHandovers();
            }
        } catch (e) { console.error("Error fetching handovers for admin:", e); }

        console.log(`Admin Dashboard: Loaded ${allBookings.length} bookings, ${myVehicles.length} cars.`);
        
        updateStatsUI();
        renderRecentBookings();
    } catch (err) {
        console.error("Admin Dashboard Error:", err);
    }
}

function renderRecentHandovers() {
    const tableBody = document.getElementById('dashboard-handovers-body');
    if (!tableBody) return;

    if (activeHandovers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #64748b;">No handovers found.</td></tr>';
        return;
    }

    // Show newest 10
    const sorted = [...activeHandovers].reverse().slice(0, 10);
    
    tableBody.innerHTML = sorted.map(h => {
        let status = "PENDING";
        try {
            const meta = JSON.parse(h.notes || '{}');
            status = meta.status || "PENDING";
        } catch(e) {}

        if (h.takerId) status = "BOOKED";

        return `
            <tr>
                <td style="padding: 12px 20px;"><strong>${h.carModel}</strong></td>
                <td style="padding: 12px 20px;">${h.renterName}</td>
                <td style="padding: 12px 20px;">${h.pickupDate} → ${h.returnDate}</td>
                <td style="padding: 12px 20px;"><strong>₹${(h.costSharing || 0).toLocaleString('en-IN')}</strong></td>
                <td style="padding: 12px 20px;"><span class="status ${status.toLowerCase()}">${status}</span></td>
            </tr>
        `;
    }).join('');
}

function updateStatsUI() {
    const totalBookingsEl = document.getElementById('stat-total-bookings');
    const totalCarsEl = document.getElementById('stat-total-cars');
    const activeUsersEl = document.getElementById('stat-active-users');
    const totalRevenueEl = document.getElementById('stat-total-revenue');

    if (totalBookingsEl) totalBookingsEl.textContent = allBookings.length;
    if (totalCarsEl) totalCarsEl.textContent = myVehicles.length;
    if (activeUsersEl) activeUsersEl.textContent = allUsers.length;
    
    // Robust revenue calculation
    let revenue = 0;
    allBookings.forEach(b => {
        const s = (b.status || '').toUpperCase();
        if (s === 'CONFIRMED' || s === 'COMPLETED' || s === 'SUCCESS' || s === 'APPROVED' || s === 'PENDING') {
            const amt = parseFloat(b.totalAmount);
            if (!isNaN(amt)) revenue += amt;
        }
    });

    if (totalRevenueEl) {
        totalRevenueEl.textContent = `₹${revenue.toLocaleString('en-IN')}`;
    }
}

function renderRecentBookings() {
    const tableBody = document.getElementById('bookings-body');
    const allBookingsBody = document.getElementById('all-bookings-body');
    
    // Show newest first
    const sorted = [...allBookings].reverse();
    const recent = sorted.slice(0, 20);

    function getBookingHTML(list) {
        if (!list || list.length === 0) {
            return '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #64748b;">No bookings found.</td></tr>';
        }
        
        return list.map(booking => {
            const car = carMap[booking.carId] || { name: `Car #${booking.carId}` };
            let statusLabel = booking.status === 'CONFIRMED' ? 'Booked' : (booking.status || 'Pending');
            
            // If it's a handover booking, mark it as Handover
            if (booking.isHandoverBooking) statusLabel = "Handover";
            
            return `
                <tr class="booking-row" data-id="${booking.id}" style="cursor: pointer;">
                    <td style="padding: 18px 20px;"><strong>${car.name}</strong></td>
                    <td style="padding: 18px 20px;">${booking.startDate} <span style="margin: 0 10px; color: #94a3b8;">→</span> ${booking.endDate}</td>
                    <td style="padding: 18px 20px;"><strong>₹${(booking.totalAmount || 0).toLocaleString('en-IN')}</strong></td>
                    <td style="padding: 18px 20px;">
                        <span class="status ${statusLabel.toLowerCase()}" style="padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 500;">
                            ${statusLabel}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    if (tableBody) tableBody.innerHTML = getBookingHTML(recent);
    if (allBookingsBody) allBookingsBody.innerHTML = getBookingHTML(sorted);
    
    // Add click handlers using Delegation
    [tableBody, allBookingsBody].forEach(body => {
        if (!body) return;
        body.onclick = (e) => {
            const row = e.target.closest('.booking-row');
            if (row) {
                const bId = parseInt(row.dataset.id);
                const booking = allBookings.find(b => b.id === bId);
                if (booking) openBookingModal(booking);
            }
        };
    });
}

function openBookingModal(booking) {
    const car = carMap[booking.carId] || { name: 'Unknown Car', imageUrl: '' };
    const imgEl = document.getElementById('modalCarImage');
    if (imgEl) imgEl.src = car.imageUrl || 'https://images.unsplash.com/photo-1494055759057-a2f2f767a6fa?w=800&q=80';
    
    const carNameEl = document.getElementById('modalCar');
    if (carNameEl) carNameEl.textContent = car.name;
    
    const datesEl = document.getElementById('modalDates');
    if (datesEl) datesEl.textContent = `${booking.startDate} → ${booking.endDate}`;
    
    const totalEl = document.getElementById('modalTotal');
    if (totalEl) totalEl.textContent = `₹${(booking.totalAmount || 0).toLocaleString('en-IN')}`;
    
    const statusElement = document.getElementById('modalStatus');
    if (statusElement) {
        const label = booking.status === 'CONFIRMED' ? 'Booked' : booking.status;
        statusElement.textContent = label;
        statusElement.className = `detail-value status ${label.toLowerCase()}`;
    }
    
    const overlay = document.getElementById('bookingModalOverlay');
    if (overlay) overlay.classList.add('active');
}

function closeBookingModal() {
    const overlay = document.getElementById('bookingModalOverlay');
    if (overlay) overlay.classList.remove('active');
}

async function fetchListedCars() {
    try {
        const response = await fetch(`${CAR_API_URL}`); 
        if (response.ok) {
            myVehicles = await response.json();
            renderVehicles();
        }
    } catch (err) {
        console.error("Fetch vehicles error:", err);
    }
}

function renderVehicles() {
    const vehiclesGrid = document.getElementById('vehicles-grid');
    if (!vehiclesGrid) return;

    if (myVehicles.length === 0) {
        vehiclesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 48px; margin-bottom: 20px;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></div>
                <h3>No Vehicles Listed</h3>
                <p>No vehicles present in the system.</p>
            </div>
        `;
        return;
    }

    vehiclesGrid.innerHTML = myVehicles.map((vehicle, index) => `
        <div class="vehicle-card" data-index="${index}" style="cursor: pointer;">
            <img src="${vehicle.imageUrl || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80'}" alt="${vehicle.name}" class="vehicle-card-image" style="width: 100%; height: 180px; object-fit: cover;">
            <div style="padding: 15px;">
                <h4 style="margin: 0 0 5px 0; font-size: 18px;">${vehicle.name}</h4>
                <p style="color: var(--text-sub); font-size: 14px; margin-bottom: 12px;">${vehicle.type} • ${vehicle.fuelType}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 700; color: #4f46e5;">₹${(vehicle.pricePerDay || 0).toLocaleString('en-IN')}/day</span>
                    <span class="status ${(vehicle.status || '').toLowerCase()}" style="padding: 4px 10px; border-radius: 20px; font-size: 12px;">${vehicle.status}</span>
                </div>
            </div>
        </div>
    `).reverse().join('');

    // Click handler for vehicles
    vehiclesGrid.onclick = (e) => {
        const card = e.target.closest('.vehicle-card');
        if (card) {
            const idx = parseInt(card.dataset.index);
            openVehicleDetails(idx);
        }
    };
}

async function openVehicleDetails(index) {
    const vehicle = myVehicles[index]; 
    if (!vehicle) return;
    currentActiveVehicle = vehicle;
    
    const imgEl = document.getElementById('modalVehicleImage');
    if (imgEl) imgEl.src = vehicle.imageUrl || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80';
    
    const nameEl = document.getElementById('modalVehicleName');
    if (nameEl) nameEl.textContent = vehicle.name;
    
    const historyBody = document.getElementById('vehicle-history-body');
    if (historyBody) {
        historyBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Loading history...</td></tr>';
        try {
            const response = await fetch(`${API_BASE_URL}/cars/${vehicle.id}/history`);
            if (response.ok) {
                const history = await response.json();
                if (history.length === 0) {
                    historyBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">No rental history yet.</td></tr>';
                } else {
                    historyBody.innerHTML = history.map(item => {
                        const displayId = item.renterDisplayId || (item.renterId ? 'TGO-' + item.renterId : 'Unknown');
                        return `
                            <tr style="cursor: pointer;" onclick="openUserProfile(${item.renterId || 'null'}, ${JSON.stringify(item).replace(/"/g, '&quot;')})">
                                <td style="color: #2563eb; text-decoration: underline;">${displayId}</td>
                                <td>${item.startDate} to ${item.endDate}</td>
                                <td>₹${(item.totalAmount || 0).toLocaleString('en-IN')}</td>
                            </tr>
                        `;
                    }).join('');
                }
            }
        } catch (err) {
            console.error("History fetch error:", err);
            historyBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Error loading history.</td></tr>';
        }
    }
    
    document.getElementById('vehicleModalOverlay').classList.add('active');
}

async function openUserProfile(userId, journeyInfo = null) {
    const modal = document.getElementById('userProfileModalOverlay');
    if (modal) modal.classList.add('active');

    // Show/hide journey details
    const journeyEl = document.getElementById('journeyDetails');
    const journeyDestination = document.getElementById('journeyDestination');
    const journeyDuration = document.getElementById('journeyDuration');

    if (journeyEl) {
        if (journeyInfo && (journeyInfo.destination || journeyInfo.durationDays)) {
            journeyEl.style.display = 'block';
            if (journeyDestination) journeyDestination.textContent = journeyInfo.destination || 'Not Specified';
            if (journeyDuration) journeyDuration.textContent = `${journeyInfo.durationDays || '-'} Days`;
        } else {
            journeyEl.style.display = 'none';
        }
    }

    if (!userId) {
        document.getElementById('userModalName').textContent = 'Unknown User';
        document.getElementById('userModalEmail').textContent = 'N/A';
        document.getElementById('userModalAvatar').innerHTML = '?';
        return;
    }

    // Set loading state
    document.getElementById('userModalName').textContent = 'Loading...';
    document.getElementById('userModalEmail').textContent = '...';
    document.getElementById('userModalAvatar').innerHTML = '?';

    try {
        const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`);
        
        if (response.ok) {
            const userData = await response.json();
            
            document.getElementById('userModalName').textContent = userData.fullName;
            document.getElementById('userModalEmail').textContent = userData.email;
            
            const initials = generateInitials(userData.fullName);
            if (userData.profilePic) {
                document.getElementById('userModalAvatar').innerHTML = `<img src="${userData.profilePic}" style="width:100%; height:100%; object-fit:cover;">`;
            } else {
                document.getElementById('userModalAvatar').innerHTML = initials;
            }
        }
    } catch (err) {
        console.error("Fetch user error:", err);
    }
}

function closeVehicleModal() {
    document.getElementById('vehicleModalOverlay').classList.remove('active');
}

async function fetchHandovers() {
    try {
        const response = await fetch(`${API_BASE_URL}/handovers`);
        if (response.ok) {
            activeHandovers = await response.json();
            renderHandovers();
        }
    } catch (err) {
        console.error("Fetch handovers error:", err);
    }
}

function renderHandovers() {
    const allHandoversBody = document.getElementById('all-handovers-body');
    if (!allHandoversBody) return;

    if (activeHandovers.length === 0) {
        allHandoversBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No handovers currently active.</td></tr>';
        return;
    }

    allHandoversBody.innerHTML = activeHandovers.map(h => {
        let status = "PENDING";
        try {
            const meta = JSON.parse(h.notes || '{}');
            status = meta.status || "PENDING";
        } catch(e) {}

        if (h.takerId) status = "BOOKED";

        return `
            <tr>
                <td><strong>${h.carModel}</strong></td>
                <td>${h.renterName}</td>
                <td>${h.pickupLocation} → ${h.destination}</td>
                <td style="font-size: 13px;">${h.pickupDate} to ${h.returnDate}</td>
                <td><strong>₹${h.costSharing}</strong></td>
                <td><span class="status ${status.toLowerCase()}">${status}</span></td>
            </tr>
        `;
    }).reverse().join('');
}

function switchView(view) {
    const views = ['dashboard-view', 'vehicles-view', 'bookings-view', 'handovers-view'];
    views.forEach(v => {
        const el = document.getElementById(v);
        if (el) el.style.display = v === `${view}-view` ? 'block' : 'none';
    });
    
    const navBtns = {
        'dashboard': 'btn-dashboard',
        'vehicles': 'btn-vehicles',
        'bookings': 'btn-bookings-nav',
        'handovers': 'btn-handovers-nav'
    };

    Object.keys(navBtns).forEach(key => {
        const btn = document.getElementById(navBtns[key]);
        if (btn) btn.classList.toggle('active', key === view);
    });
    
    if (view === 'dashboard' || view === 'bookings') fetchDashboardStats();
    if (view === 'vehicles') fetchListedCars();
    if (view === 'handovers') fetchHandovers();
}

function openFullDetailsModal() {
    if (!currentActiveVehicle) return;
    
    document.getElementById('detail-name').textContent = currentActiveVehicle.name || 'N/A';
    document.getElementById('detail-type').textContent = currentActiveVehicle.type || 'N/A';
    document.getElementById('detail-transmission').textContent = currentActiveVehicle.transmission || 'N/A';
    document.getElementById('detail-seating').textContent = currentActiveVehicle.seating ? (currentActiveVehicle.seating + ' Seats') : 'N/A';
    document.getElementById('detail-luggage').textContent = currentActiveVehicle.luggage ? (currentActiveVehicle.luggage + ' Bags') : 'N/A';
    document.getElementById('detail-fuelType').textContent = currentActiveVehicle.fuelType || 'N/A';
    document.getElementById('detail-fuelIncluded').textContent = currentActiveVehicle.fuelChargesIncluded ? 'Included in Price' : 'Not Included';
    document.getElementById('detail-price').textContent = currentActiveVehicle.pricePerDay ? ('₹' + currentActiveVehicle.pricePerDay.toLocaleString('en-IN') + '/day') : 'N/A';
    document.getElementById('detail-deposit').textContent = currentActiveVehicle.refundableDeposit ? ('₹' + currentActiveVehicle.refundableDeposit.toLocaleString('en-IN')) : '₹0';
    document.getElementById('detail-allowHandover').textContent = currentActiveVehicle.allowHandover ? 'Yes, Allowed' : 'No, Prohibited';
    document.getElementById('detail-location').textContent = currentActiveVehicle.location || 'N/A';
    document.getElementById('detail-nearbyHub').textContent = currentActiveVehicle.nearbyHub || 'None';
    document.getElementById('detail-status').textContent = currentActiveVehicle.status || 'N/A';
    
    // Owner Info
    document.getElementById('detail-owner').textContent = currentActiveVehicle.ownerName || 'Unknown Owner';
    document.getElementById('detail-owner-email').textContent = currentActiveVehicle.ownerEmail || 'N/A';
    
    document.getElementById('fullDetailsModalOverlay').classList.add('active');
    closeVehicleModal();
}

function closeFullDetailsModal() {
    document.getElementById('fullDetailsModalOverlay').classList.remove('active');
}

async function deleteVehicle() {
    if (!currentActiveVehicle) return;
    if (confirm(`Are you sure you want to delete "${currentActiveVehicle.name}"? This action cannot be undone.`)) {
        try {
            const response = await fetch(`${API_BASE_URL}/cars/${currentActiveVehicle.id}`, { method: 'DELETE' });
            if (response.ok) {
                // Notify Admin
                await fetch(`${API_BASE_URL}/messages/sendDirect`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipientId: 1, // Admin
                        senderId: user.id || 1,
                        senderName: user.fullName || "Admin",
                        senderEmail: user.email || "admin@tripgo.com",
                        carName: currentActiveVehicle.name,
                        type: 'CAR_DELETED'
                    })
                });
                alert("Vehicle deleted successfully!");
                closeVehicleModal();
                fetchListedCars();
            } else { alert("Failed to delete vehicle."); }
        } catch (err) { console.error("Delete error:", err); }
    }
}

async function resetDatabase() {
    if (confirm("⚠️ CRITICAL ACTION: Are you sure you want to RESET the entire database? This will delete all bookings, reviews, and user-listed cars. This cannot be undone.")) {
        if (confirm("FINAL CONFIRMATION: Are you absolutely sure?")) {
            try {
                const response = await fetch(`${API_BASE_URL}/system/reset`, { method: 'POST' });
                if (response.ok) {
                    const msg = await response.text();
                    alert("✅ SUCCESS: " + msg);
                    window.location.reload(); // Refresh to show clean state
                } else {
                    const err = await response.text();
                    alert("❌ FAILED: " + err);
                }
            } catch (err) {
                console.error("Reset error:", err);
                alert("❌ ERROR: Could not connect to the server for reset.");
            }
        }
    }
}

// Initial Load
document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'ADMIN') {
        window.location.href = 'login.html';
        return;
    }

    updateAllProfileIcons();
    initNotifications();
    fetchDashboardStats();
    
    // Navigation
    const dashBtn = document.getElementById('btn-dashboard');
    if (dashBtn) dashBtn.addEventListener('click', (e) => { e.preventDefault(); switchView('dashboard'); });
    
    const vehBtn = document.getElementById('btn-vehicles');
    if (vehBtn) vehBtn.addEventListener('click', (e) => { e.preventDefault(); switchView('vehicles'); });
    
    const bookBtn = document.getElementById('btn-bookings-nav');
    if (bookBtn) bookBtn.addEventListener('click', (e) => { e.preventDefault(); switchView('bookings'); });
    
    const handBtn = document.getElementById('btn-handovers-nav');
    if (handBtn) handBtn.addEventListener('click', (e) => { e.preventDefault(); switchView('handovers'); });

    // Modal Listeners
    const closeBooking = document.getElementById('closeBookingModal');
    if (closeBooking) closeBooking.addEventListener('click', closeBookingModal);
    
    const closeVeh = document.getElementById('closeVehicleModal');
    if (closeVeh) closeVeh.addEventListener('click', closeVehicleModal);
    
    const closeFull = document.getElementById('closeFullDetailsModal');
    if (closeFull) closeFull.addEventListener('click', closeFullDetailsModal);
    
    const backBtn = document.getElementById('back-to-stats-btn');
    if (backBtn) backBtn.addEventListener('click', () => {
        closeFullDetailsModal();
        document.getElementById('vehicleModalOverlay').classList.add('active');
    });

    const fullDetailsBtn = document.getElementById('view-full-details-btn');
    if (fullDetailsBtn) fullDetailsBtn.addEventListener('click', openFullDetailsModal);

    const deleteBtn = document.getElementById('delete-vehicle-btn');
    if (deleteBtn) deleteBtn.addEventListener('click', deleteVehicle);

    const resetBtn = document.getElementById('btn-reset-db');
    if (resetBtn) resetBtn.addEventListener('click', (e) => { e.preventDefault(); resetDatabase(); });
});
