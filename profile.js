let lastSeenMessageId = null;

function generateInitials(name) {
    if (!name || typeof name !== 'string') return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return "U";
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function updateAllProfileIcons() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    const initials = generateInitials(user.fullName || "User");
    
    // 1. Update Profile Avatar (Sidebars)
    const avatars = document.querySelectorAll('.profile-avatar, #profileAvatar');
    avatars.forEach(avatar => {
        // If it's the dashboard avatar, it might have an edit icon we need to preserve
        const isDashboardAvatar = avatar.id === 'profileAvatar' && window.location.pathname.includes('profile.html');
        const editIconHTML = isDashboardAvatar ? `
            <div class="avatar-edit-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </div>` : '';

        if (user.profilePic) {
            avatar.innerHTML = `<img src="${user.profilePic}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">${editIconHTML}`;
        } else {
            avatar.innerHTML = `${initials}${editIconHTML}`;
        }
    });

    // 2. Update Profile Triggers (Top Nav Dropdowns)
    const triggers = document.querySelectorAll('.profile-trigger, #profile-trigger');
    triggers.forEach(trigger => {
        if (user.profilePic) {
            trigger.innerHTML = `<img src="${user.profilePic}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            trigger.style.background = ''; // Reset
        } else {
            trigger.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
            trigger.style.background = ''; // Reset
        }
    });

    // 3. Update User Names
    const nameElements = document.querySelectorAll('#userName, .dropdown-header span');
    nameElements.forEach(el => {
        if (el.tagName === 'SPAN' && el.parentElement.classList.contains('dropdown-header')) {
            el.textContent = user.fullName;
        } else {
            el.textContent = user.fullName;
        }
    });

    // 4. Update Emails & Status Badges
    const emailElements = document.querySelectorAll('.dropdown-header small');
    emailElements.forEach(el => {
        el.textContent = user.email;
    });

    // Update Status Badges (under profile name in sidebar)
    const statusBadges = document.querySelectorAll('.status-badge');
    statusBadges.forEach(badge => {
        if (user.role === 'ADMIN') {
            badge.textContent = 'Admin';
            badge.style.background = '#eef2ff';
            badge.style.color = '#4f46e5';
            badge.style.border = '1px solid #c7d2fe';
        } else {
            badge.textContent = 'User';
            badge.style.background = '#dcfce7'; // Default green background
            badge.style.color = '#16a34a'; // Default green text
            badge.style.border = ''; // Default border
        }
    });
}

// Notification Toast System
function showWowNotification(m) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    let type = 'info';
    let icon = '🔔';
    let title = 'Notification';

    const mType = (m.type || '').toUpperCase();
    if (mType === 'NEW_BOOKING' || mType === 'BOOKED' || mType === 'CONFIRMATION') {
        type = 'success'; icon = '🚗'; title = 'Car Booked!';
    } else if (mType === 'CANCELLATION') {
        type = 'danger'; icon = '❌'; title = 'Booking Cancelled';
    } else if (mType === 'HANDOVER_ACCEPTED' || mType === 'HANDOVER') {
        type = 'success'; icon = '🤝'; title = 'Handover Update';
    } else if (mType === 'EARLY_END_REQUEST') {
        type = 'warning'; icon = '⏳'; title = 'Early Return Request';
    } else if (mType === 'EARLY_COMPLETED') {
        type = 'success'; icon = '🏁'; title = 'Trip Completed Early';
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon" style="font-size: 20px;">${icon}</div>
        <div class="toast-content">
            <div class="toast-title">${title} <span style="margin-left:auto; opacity:0.5; font-size:10px;">✕</span></div>
            <div class="toast-message">${m.carName || 'Update'}: ${m.senderName || 'System'} has sent a message.</div>
            <div class="toast-time">Just Now</div>
        </div>
    `;

    toast.onclick = (e) => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 500);
        if (typeof switchView === 'function') switchView('messages');
    };

    container.appendChild(toast);
    
    // Play a subtle notification sound (optional, but adds "Wow")
    try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.2;
        audio.play();
    } catch(e) {}

    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 500);
        }
    }, 6000);
}

// Helper to send emails via notification service
async function sendEmail(email, subject, message) {
    if (typeof NOTIFY_API_URL === 'undefined') {
        console.warn("NOTIFY_API_URL is not defined in config.js");
        return;
    }
    try {
        await fetch(`${NOTIFY_API_URL}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, subject, message })
        });
        console.log("✅ Email notification sent to:", email);
    } catch (err) {
        console.warn("❌ Failed to send email notification:", err);
    }
}

// Notification Toast System
function initNotificationBell() {
    const notifBtn = document.getElementById('notificationBtn');
    const notifDropdown = document.getElementById('notificationDropdown');
    const markAllRead = document.getElementById('markAllRead');

    if (notifBtn && notifDropdown) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifDropdown.classList.toggle('active');
            
            // Add pulse effect on click
            notifBtn.classList.add('pulse');
            setTimeout(() => notifBtn.classList.remove('pulse'), 500);
        });

        document.addEventListener('click', () => {
            notifDropdown.classList.remove('active');
        });

        notifDropdown.addEventListener('click', (e) => e.stopPropagation());
    }

    if (markAllRead) {
        markAllRead.addEventListener('click', async (e) => {
            e.preventDefault();
            const user = JSON.parse(localStorage.getItem('user'));
            const apiHost = window.location.hostname || '127.0.0.1';
            
            try {
                // Fetch all unread messages
                const res = await fetch(`${MESSAGE_API_URL}/user/${user.id}`);
                if (res.ok) {
                    const messages = await res.json();
                    const unread = messages.filter(m => !m.read);
                    
                    // Mark each as read
                    for (const m of unread) {
                        await fetch(`${MESSAGE_API_URL}/${m.id}/read`, { method: 'PATCH' });
                    }
                    
                    fetchMessages(); // Refresh UI without alert popup
                }
            } catch (err) { console.error("Mark all read error:", err); }
        });
    }

    // REAL-TIME POLLING: Check for new messages every 10 seconds
    if (!window.notifIntervalSet) {
        setInterval(() => {
            console.log("Polling for new notifications...");
            fetchMessages(true); // pass 'true' to indicate it's a background fetch
        }, 10000);
        window.notifIntervalSet = true;
    }
}

function handleNotificationClick(id) {
    // Optionally mark as read and redirect
    fetch(`${MESSAGE_API_URL}/${id}`)
        .then(res => res.json())
        .then(m => {
            fetch(`${MESSAGE_API_URL}/${m.id}/read`, { method: 'PATCH' });
            
            if (m.type === 'HANDOVER_PROMPT') {
                const url = `browsecar.html?mode=handover&car=${encodeURIComponent(m.carName)}&bookingId=${m.bookingId}&prefill=true`;
                window.location.href = url;
            } else {
                switchView('messages');
                fetchMessages();
            }
        });
}

function updateNotificationBadge(messages) {
    const badge = document.getElementById('notifBadge');
    const bellBtn = document.getElementById('notificationBtn');
    if (!badge) return;
    
    const unreadCount = messages.filter(m => !m.read).length;
    if (unreadCount > 0) {
        const hasIncreased = parseInt(badge.innerText) < unreadCount;
        badge.innerText = unreadCount;
        badge.style.display = 'flex';
        
        if (hasIncreased) {
            badge.classList.remove('pop');
            void badge.offsetWidth; // Trigger reflow
            badge.classList.add('pop');
            
            if (bellBtn) {
                bellBtn.classList.add('pulse-ring');
            }
        }
    } else {
        badge.style.display = 'none';
        if (bellBtn) bellBtn.classList.remove('pulse-ring');
    }
}

function renderNotificationDropdown(messages) {
    const list = document.getElementById('notificationList');
    if (!list) return;

    if (messages.length === 0) {
        list.innerHTML = '<div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">No new notifications</div>';
        return;
    }

    list.innerHTML = messages.slice(0, 5).map(m => {
        let title = "New Notification";
        let iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`;
        let iconBg = "#f1f5f9";
        let iconColor = "#64748b";

        const mType = (m.type || '').toUpperCase();
        if (mType === 'CONFIRMATION' || mType === 'BOOKED') { 
            title = "Car Booked!"; 
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            iconBg = "#ecfdf5"; iconColor = "#059669";
        } else if (mType === 'NEW_BOOKING') { 
            title = "New Booking Received"; 
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>`;
            iconBg = "#eef2ff"; iconColor = "#4f46e5";
        } else if (mType === 'HANDOVER' || mType === 'HANDOVER_ACCEPTED') { 
            title = "Handover Update"; 
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
            iconBg = "#fff7ed"; iconColor = "#ea580c";
        } else if (mType === 'HANDOVER_PROMPT') { 
            title = "Action Required: Handover"; 
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>`;
            iconBg = "#eff6ff"; iconColor = "#2563eb";
        }

        return `
            <div class="notif-dropdown-item" style="padding: 15px; border-bottom: 1px solid #f1f5f9; cursor: pointer; background: ${m.read ? 'white' : '#f8faff'}; transition: all 0.2s;" onclick="handleNotificationClick(${m.id})" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='${m.read ? 'white' : '#f8faff'}'">
                <div style="display: flex; gap: 15px; align-items: flex-start;">
                    <div style="min-width: 40px; height: 40px; border-radius: 12px; background: ${iconBg}; display: flex; align-items: center; justify-content: center; color: ${iconColor};">
                        ${iconSvg}
                    </div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                            <p style="margin: 0; font-size: 13px; font-weight: 700; color: #1e293b;">${title}</p>
                            ${!m.read ? '<span style="width: 6px; height: 6px; background: #2563eb; border-radius: 50%;"></span>' : ''}
                        </div>
                        <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px;">${m.carName || 'Message Update'}</p>
                        <small style="color: #94a3b8; font-size: 10px; font-weight: 500; margin-top: 4px; display: block;">${new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

// Attach listeners to bell icons
function initNotifications() {
    initNotificationBell();
}

async function fetchDashboardStats() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        console.error("No user found in localStorage");
        return;
    }

    console.log("Fetching dashboard stats for user:", user.id);
    const baseUrl = API_BASE_URL;

    try {
        // 0. Fetch User to get latest points
        const userRes = await fetch(`${baseUrl}/auth/users/${user.id}`);
        if (userRes.ok) {
            const userData = await userRes.json();
            const points = userData.tripPoints || 0;
            
            // Update Dashboard/Stats if elements exist
            const pointsEl = document.getElementById('stat-trip-points');
            if (pointsEl) pointsEl.textContent = points.toLocaleString();
            
            // Update Passbook (Transactions View)
            const passbookTokens = document.getElementById('total-tokens');
            const passbookWorth = document.getElementById('tokens-worth');
            const walletBalanceEl = document.getElementById('wallet-balance-display');

            if (passbookTokens) passbookTokens.textContent = `${points.toLocaleString()} Tokens`;
            if (passbookWorth) passbookWorth.textContent = `Worth ₹${(points * 10).toLocaleString('en-IN')}`;
            if (walletBalanceEl) {
                const balance = userData.walletBalance || 0;
                walletBalanceEl.textContent = `₹${balance.toLocaleString('en-IN')}`;
            }
            
            // Sync with local storage
            const updatedUser = { ...user, tripPoints: points, walletBalance: userData.walletBalance };
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }

        // 1. Fetch all cars to map names/images
        let carMap = {};
        try {
            console.log("Fetching all cars for mapping...");
            const carsRes = await fetch(`${baseUrl}/cars`);
            if (carsRes.ok) {
                const cars = await carsRes.json();
                cars.forEach(c => carMap[c.id] = c);
                console.log("Loaded carMap with", Object.keys(carMap).length, "cars");
            }
        } catch (e) {
            console.error("Error fetching cars for map:", e);
        }

        // 2. Fetch Bookings
        console.log("Fetching bookings for user:", user.id);
        const bookingsRes = await fetch(`${baseUrl}/bookings/user/${user.id}`);
        if (bookingsRes.ok) {
            const bookings = await bookingsRes.json();
            console.log("Fetched bookings:", bookings);
            
            // Render the table
            renderRecentBookings(bookings, carMap);

            // Update Stats
            const activeBookings = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'PENDING').length;
            const activeEl = document.getElementById('stat-active-bookings');
            if (activeEl) activeEl.textContent = activeBookings.toLocaleString();

            const totalSpent = bookings.reduce((sum, b) => {
                const status = (b.status || '').toUpperCase();
                // Sum only successful/confirmed/pending bookings like admin.js does for revenue
                if (status === 'CONFIRMED' || status === 'COMPLETED' || status === 'SUCCESS' || status === 'APPROVED' || status === 'PENDING') {
                    return sum + (parseFloat(b.totalAmount) || 0);
                }
                return sum;
            }, 0);
            
            const spentEl = document.getElementById('stat-total-spent');
            if (spentEl) spentEl.textContent = `₹${totalSpent.toLocaleString('en-IN')}`;
            
            const rentedEl = document.getElementById('stat-cars-rented');
            if (rentedEl) rentedEl.textContent = bookings.length.toLocaleString();

            const handoverEl = document.getElementById('stat-handovers');
            if (handoverEl) {
                // Fetch latest handovers to count
                const hRes = await fetch(`${baseUrl}/handovers`);
                if (hRes.ok) {
                    const hData = await hRes.json();
                    const myHandovers = hData.filter(h => {
                        const initiator = (h.renterEmail || '').toLowerCase();
                        const taker = (h.takerEmail || '').toLowerCase();
                        const me = (user.email || '').toLowerCase();
                        return initiator === me || taker === me;
                    });
                    handoverEl.textContent = myHandovers.length.toLocaleString();
                }
            }
        } else {
            console.error("Failed to fetch bookings:", bookingsRes.status);
        }

        // 3. Fetch Handovers to mark listed bookings
        try {
            const handoverRes = await fetch(`${baseUrl}/handovers`);
            if (handoverRes.ok) {
                window.allHandovers = await handoverRes.json();
            }
        } catch (e) {
            console.error("Error fetching handovers:", e);
        }

    } catch (err) {
        console.error("Fatal error fetching dashboard stats:", err);
        showConnectionError("Could not connect to backend server. Please make sure it is running on port 8080.");
    }
}

async function redeemPromoCode() {
    const input = document.getElementById('promo-code-input');
    const code = input.value.trim().toUpperCase();
    if (!code) return;

    // For testing/demo, any code starting with "GIFT" gives points
    if (code.startsWith('GIFT')) {
        const amount = 500; // Default gift amount
        const user = JSON.parse(localStorage.getItem('user'));
        const apiHost = window.location.hostname || '127.0.0.1';
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/users/${user.id}/add-points?amount=${amount}`, {
                method: 'POST'
            });
            if (response.ok) {
                alert(`Congratulations! You've redeemed ${amount} Trip Points!`);
                input.value = '';
                fetchDashboardStats();
            } else {
                alert("Redemption failed.");
            }
        } catch (err) { console.error("Redeem error:", err); }
    } else {
        alert("Invalid promo code. Try 'GIFT500'");
    }
}

function openConvertModal() {
    const modal = document.getElementById('convertPointsModalOverlay');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('generatedCodeSection').style.display = 'none';
        document.getElementById('convertPointsAmount').value = '';
    }
}

function closeConvertModal() {
    const modal = document.getElementById('convertPointsModalOverlay');
    if (modal) modal.classList.remove('active');
}

async function processPointConversion() {
    const amountInput = document.getElementById('convertPointsAmount');
    const amount = parseFloat(amountInput.value);
    
    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount of points.");
        return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    const apiHost = window.location.hostname || '127.0.0.1';
    
    const confirmBtn = document.getElementById('confirmConvertBtn');
    confirmBtn.disabled = true;
    confirmBtn.innerText = "Generating...";

    try {
        const response = await fetch(`${API_BASE_URL}/auth/vouchers/generate?userId=${user.id}&amount=${amount}`, {
            method: 'POST'
        });

        if (response.ok) {
            const data = await response.json();
            const code = data.code;
            
            document.getElementById('generatedCodeText').textContent = code;
            document.getElementById('generatedCodeValue').textContent = (amount * 10).toLocaleString('en-IN');
            document.getElementById('generatedCodeSection').style.display = 'block';
            
            confirmBtn.innerText = "Generated!";
            
            // Refresh balance
            fetchDashboardStats();
        } else {
            const err = await response.text();
            alert("Conversion failed: " + err);
            confirmBtn.disabled = false;
            confirmBtn.innerText = "Generate Code";
        }
    } catch (err) {
        console.error("Conversion error:", err);
        alert("Server error during conversion.");
        confirmBtn.disabled = false;
        confirmBtn.innerText = "Generate Code";
    }
}

function showConnectionError(msg) {
    const table = document.querySelector('.recent-bookings');
    if (table) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'connection-error';
        errorDiv.style.padding = '20px';
        errorDiv.style.margin = '20px 0';
        errorDiv.style.backgroundColor = '#fee2e2';
        errorDiv.style.color = '#dc2626';
        errorDiv.style.borderRadius = '8px';
        errorDiv.style.border = '1px solid #fecaca';
        errorDiv.style.fontSize = '14px';
        errorDiv.style.textAlign = 'center';
        errorDiv.innerHTML = `
            <strong>Connection Issue:</strong> ${msg} 
            <br><button onclick="window.location.reload()" style="margin-top: 10px; padding: 5px 15px; border-radius: 4px; border: 1px solid #dc2626; background: white; color: #dc2626; cursor: pointer; font-weight: 600;">Retry Connection</button>
            <br><small style="display: block; margin-top: 5px; color: #991b1b;">If the problem persists, try logging out and logging in again.</small>
        `;
        table.prepend(errorDiv);
    }
}

function renderRecentBookings(bookings, carMap) {
    const tableBody = document.getElementById('bookings-body');
    const allBookingsBody = document.getElementById('all-bookings-body');
    
    console.log("PROFILE DEBUG: Rendering bookings. Count:", bookings.length);

    // Show newest first
    const sorted = [...bookings].reverse();
    const recent = sorted.slice(0, 10); // Show only top 10 on dashboard

    function getBookingHTML(list) {
        if (!list || list.length === 0) {
            return '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #64748b;">No bookings found.</td></tr>';
        }
        
        return list.map(booking => {
            const car = carMap[booking.carId] || { name: `Car #${booking.carId}` };
            // Standardize status label like admin.js
            let statusValue = (booking.status || 'PENDING').toUpperCase();
            let statusLabel = statusValue === 'CONFIRMED' ? 'Booked' : (statusValue === 'CANCELLED' ? 'Cancelled' : statusValue.charAt(0) + statusValue.slice(1).toLowerCase());
            
            // If it's a handover booking OR listed for handover by user
            const isHandover = booking.isHandoverBooking || (booking.destination && booking.destination.includes('[HANDOVER]')) || (window.allHandovers || []).some(h => h.bookingId === booking.id);
            
            if (isHandover) {
                statusLabel = 'Handover';
            }
            
            const canInitiateHandover = (statusLabel === 'Booked' || statusValue === 'SUCCESS' || statusValue === 'PAID') && 
                                        car.allowHandover !== false && 
                                        !isHandover;

            console.log(`PROFILE DEBUG: Booking ${booking.id} - StatusValue: ${statusValue}, StatusLabel: ${statusLabel}, allowHandover: ${car.allowHandover}, isHandover: ${isHandover}, CanInitiate: ${canInitiateHandover}`);
            
            return `
                <tr class="booking-row" data-id="${booking.id}" style="border-bottom: 1px solid #f1f5f9; cursor: pointer;">
                    <td style="padding: 18px 20px;"><strong>${car.name}</strong></td>
                    <td style="padding: 18px 20px;">
                        <span style="display: flex; align-items: center; gap: 8px;">
                            ${booking.startDate} 
                            <span style="color: #94a3b8; font-size: 14px;">→</span> 
                            ${booking.endDate}
                        </span>
                    </td>
                    <td style="padding: 18px 20px;"><strong>₹${(booking.totalAmount || 0).toLocaleString('en-IN')}</strong></td>
                    <td style="padding: 18px 20px;">
                        <span class="status ${statusLabel.toLowerCase()}" style="padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; display: inline-block;">
                            ${statusLabel}
                        </span>
                        ${canInitiateHandover ? `
                            <button class="action-btn secondary initiate-handover-btn" 
                                    style="display: block; width: 100%; margin-top: 8px; padding: 4px 8px; font-size: 11px; border-radius: 12px; border: 1px solid #2563eb; background: transparent; color: #2563eb; cursor: pointer; font-weight: 600;" 
                                    onclick="event.stopPropagation(); 
                                    openInitiateHandover('${car.id}', '${car.name}', '${booking.id}', '${car.ownerName || ''}', '${car.ownerEmail || ''}', ${booking.totalAmount || 0}, ${car.pricePerDay || 0}, '${booking.startDate}', '${booking.endDate}', '${car.location || ''}', '${car.imageUrl || ''}', '${car.nearbyHub || ''}')">
                                Initiate Handover
                            </button>` 
                        : ''}
                    </td>
                </tr>
            `;
        }).join('');
    }

    if (tableBody) {
        tableBody.innerHTML = getBookingHTML(recent);
        tableBody.onclick = (e) => handleRowClick(e, bookings, carMap);
    }
    if (allBookingsBody) {
        allBookingsBody.innerHTML = getBookingHTML(sorted);
        allBookingsBody.onclick = (e) => handleRowClick(e, sorted, carMap);
    }
}

function handleRowClick(e, bookings, carMap) {
    const row = e.target.closest('.booking-row');
    if (row && !e.target.closest('button')) {
        const bId = parseInt(row.dataset.id);
        const booking = bookings.find(b => b.id === bId);
        if (booking) openBookingModal(booking, carMap);
    }
}

function openBookingModal(booking, carMap) {
    const car = carMap[booking.carId] || { name: 'Unknown Car', imageUrl: '' };
    const imgEl = document.getElementById('modalCarImage');
    if (imgEl) imgEl.src = car.imageUrl || 'https://images.unsplash.com/photo-1494055759057-a2f2f767a6fa?w=800&q=80';
    
    const carNameEl = document.getElementById('modalCar');
    if (carNameEl) carNameEl.textContent = car.name;
    
    const datesEl = document.getElementById('modalDates');
    if (datesEl) datesEl.textContent = `${booking.startDate} → ${booking.endDate}`;
    
    const totalEl = document.getElementById('modalTotal');
    if (totalEl) totalEl.textContent = `₹${(booking.totalAmount || 0).toLocaleString('en-IN')}`;
    
    // Update labels
    const statusEl = document.getElementById('modalStatus');
    let statusValue = (booking.status || 'PENDING').toUpperCase();
    let statusLabel = statusValue === 'CONFIRMED' ? 'Booked' : (statusValue === 'CANCELLED' ? 'Cancelled' : statusValue.charAt(0) + statusValue.slice(1).toLowerCase());
    
    // Check for handover in modal too
    const isHandoverBooking = booking.isHandoverBooking || (booking.destination && booking.destination.includes('[HANDOVER]'));
    const isListedForHandover = (window.allHandovers || []).some(h => h.bookingId === booking.id);

    if (isHandoverBooking || isListedForHandover) {
        statusLabel = 'Handover';
    }
    
    if (statusEl) {
        statusEl.textContent = statusLabel;
        statusEl.className = `detail-value status ${statusLabel.toLowerCase()}`;
    }
    
    const destEl = document.getElementById('modalDestination');
    if (destEl) {
        let displayDest = booking.destination || 'Not Specified';
        // Strip the [HANDOVER] marker if present for clean display
        if (displayDest.includes('[HANDOVER]')) {
            displayDest = displayDest.replace('[HANDOVER]', '').trim();
        }
        destEl.textContent = displayDest;
    }

    // Handlers for action buttons visibility
    const cancelBtn = document.getElementById('cancelBookingBtn');
    const initiateModalBtn = document.getElementById('initiateHandoverModalBtn');
    
    if (cancelBtn) {
        // Only allow cancellation if booking is not completed/cancelled
        const canCancel = ['CONFIRMED', 'PENDING'].includes(statusValue);
        cancelBtn.style.display = canCancel ? 'block' : 'none';
    }

    if (initiateModalBtn) {
        const isHandoverBooking = booking.isHandoverBooking || (booking.destination && booking.destination.includes('[HANDOVER]'));
        const isListedForHandover = (window.allHandovers || []).some(h => h.bookingId === booking.id);

        const canInitiate = (statusValue === 'CONFIRMED' || statusValue === 'SUCCESS' || statusValue === 'PAID') && 
                            car.allowHandover !== false && 
                            !isHandoverBooking && !isListedForHandover;
        
        initiateModalBtn.style.display = canInitiate ? 'block' : 'none';
        if (canInitiate) {
            initiateModalBtn.onclick = () => {
                openInitiateHandover(car.id, car.name, booking.id, car.ownerName || '', car.ownerEmail || '', booking.totalAmount || 0, car.pricePerDay || 0, booking.startDate, booking.endDate, car.location || '', car.imageUrl || '', car.nearbyHub || '');
            };
        }
    }

    const endTripBtn = document.getElementById('endTripEarlyBtn');
    if (endTripBtn) {
        // Show "End Trip Early" if booking is CONFIRMED or is a handover booking that's active
        const isHandover = booking.isHandoverBooking || (booking.destination && booking.destination.includes('[HANDOVER]'));
        const canEndEarly = (statusValue === 'CONFIRMED' || statusValue === 'SUCCESS' || statusValue === 'PAID' || isHandover) && 
                            statusValue !== 'COMPLETED' && statusValue !== 'CANCELLED';
        
        endTripBtn.style.display = canEndEarly ? 'block' : 'none';
    }

    currentActiveBooking = booking;

    const modal = document.getElementById('bookingModalOverlay');
    if (modal) modal.classList.add('active');
}

async function cancelBooking() {
    if (!currentActiveBooking) return;
    
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const apiHost = window.location.hostname || '127.0.0.1';
        const baseUrl = `http://${apiHost}:8080/api`;

        // 1. Update the booking status to CANCELLED
        const updateRes = await fetch(`${baseUrl}/bookings/${currentActiveBooking.id}/status?status=CANCELLED`, {
            method: 'PATCH'
        });

        if (updateRes.ok) {
            // 2. Update car status back to AVAILABLE
            await fetch(`${baseUrl}/cars/${currentActiveBooking.carId}/status?status=AVAILABLE`, {
                method: 'PATCH'
            });

            // 3. Send cancellation messages
            // Fetch car info to get name for message if not already available
            const carRes = await fetch(`${baseUrl}/cars`);
            let carName = "Car";
            if (carRes.ok) {
                const cars = await carRes.json();
                const car = cars.find(c => c.id === currentActiveBooking.carId);
                if (car) carName = car.name;
            }

            // A. Notify the Owner of the car
            try {
                await fetch(`${baseUrl}/messages/send?carId=${currentActiveBooking.carId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        senderId: user.id,
                        senderName: user.fullName,
                        senderEmail: user.email,
                        carName: carName,
                        type: 'CANCELLATION',
                        origin: currentActiveBooking.origin || 'N/A',
                        destination: currentActiveBooking.destination || 'N/A',
                        startDate: currentActiveBooking.startDate,
                        endDate: currentActiveBooking.endDate,
                        notes: `Booking #${currentActiveBooking.id} for your car "${carName}" has been cancelled by the renter.`
                    })
                });
            } catch (err) { console.error("Notify owner error:", err); }

            // B. Send confirmation to the Renter (self)
            try {
                await fetch(`${baseUrl}/messages/sendDirect`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipientId: user.id,
                        senderId: 1, // System
                        senderName: "TripGo System",
                        senderEmail: "support@tripgo.com",
                        carName: carName,
                        type: 'CANCELLATION',
                        startDate: currentActiveBooking.startDate,
                        endDate: currentActiveBooking.endDate,
                        notes: `You have successfully cancelled your booking for "${carName}".`
                    })
                });
            } catch (err) { console.error("Notify renter error:", err); }

            // C. Send actual Email via Brevo
            const cancelSubject = `TripGo: Booking Cancelled - #${currentActiveBooking.id}`;
            const cancelMessage = `Hello ${user.fullName},\n\n` +
                                 `Your booking for ${carName} (#${currentActiveBooking.id}) has been successfully cancelled.\n` +
                                 `Refund (if applicable) will be processed as per our policy.\n\n` +
                                 `Dates: ${currentActiveBooking.startDate} to ${currentActiveBooking.endDate}\n\n` +
                                 `Thank you for using TripGo.`;
            
            await sendEmail(user.email, cancelSubject, cancelMessage);

            alert("Booking cancelled successfully!");
            closeBookingModal();
            fetchDashboardStats(); // Refresh the list
            fetchMessages(); // Refresh messages list
        } else {
            alert("Failed to cancel booking.");
        }
    } catch (err) {
        console.error("Cancel booking error:", err);
        alert("An error occurred while cancelling the booking.");
    }
}

async function completeTripEarly() {
    // This is the old button handler, renamed to open modal
    openEarlyEndModal();
}

function openEarlyEndModal() {
    if (!currentActiveBooking) return;
    
    const modal = document.getElementById('earlyEndModalOverlay');
    if (modal) {
        modal.classList.add('active');
        
        const dateInput = document.getElementById('earlyEndDateInput');
        if (dateInput) {
            // Min date is today, max date is original end date
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
            dateInput.max = currentActiveBooking.endDate;
            dateInput.value = today;
            
            // Initial calculation
            updateRefundPreview();
            
            dateInput.onchange = updateRefundPreview;
        }
    }
    // Close the booking details modal
    closeBookingModal();
}

function updateRefundPreview() {
    const dateInput = document.getElementById('earlyEndDateInput');
    const preview = document.getElementById('refundPreview');
    const pointsSpan = document.getElementById('estimatedRefundPoints');
    
    if (!dateInput || !preview || !pointsSpan || !currentActiveBooking) return;
    
    const newEnd = new Date(dateInput.value);
    const originalEnd = new Date(currentActiveBooking.endDate);
    
    if (isNaN(newEnd.getTime()) || newEnd >= originalEnd) {
        preview.style.display = 'none';
        return;
    }
    
    const diffTime = Math.abs(originalEnd - newEnd);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
        const pricePerDay = currentActiveBooking.pricePerDay || 0;
        const unusedValue = pricePerDay * diffDays;
        const refundPoints = Math.floor(unusedValue * 0.40);
        
        pointsSpan.textContent = `${refundPoints.toLocaleString()} Points`;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
}

async function submitEarlyEndRequest() {
    const dateInput = document.getElementById('earlyEndDateInput');
    if (!dateInput || !currentActiveBooking) return;
    
    const newEndDate = dateInput.value;
    if (!newEndDate) {
        alert("Please select a date.");
        return;
    }

    if (!confirm(`Are you sure you want to request to end your trip on ${newEndDate}? This request will be sent to the owner for approval.`)) return;

    try {
        const apiHost = window.location.hostname || '127.0.0.1';
        const baseUrl = `http://${apiHost}:8080/api`;

        const response = await fetch(`${baseUrl}/bookings/${currentActiveBooking.id}/request-early-completion?newEndDate=${newEndDate}`, {
            method: 'POST'
        });

        if (response.ok) {
            alert("Request sent successfully! You will be notified once the owner approves.");
            closeEarlyEndModal();
            fetchMessages(); // Refresh messages to see the request (if applicable)
        } else {
            const err = await response.text();
            alert("Failed to send request: " + err);
        }
    } catch (err) {
        console.error("Submit early end error:", err);
        alert("An error occurred.");
    }
}

function closeEarlyEndModal() {
    const modal = document.getElementById('earlyEndModalOverlay');
    if (modal) modal.classList.remove('active');
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModalOverlay');
    if (modal) modal.classList.remove('active');
}

// --- Booking Management ---
let currentActiveBooking = null;

// --- Vehicle Management ---
let myVehicles = [];
let currentActiveVehicle = null;

async function fetchListedCars() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        console.error("No user found in localStorage for listed cars");
        return;
    }

    try {
        console.log("Fetching listed cars for user ID:", user.id);
        const apiHost = window.location.hostname || '127.0.0.1';
        const response = await fetch(`${CAR_API_URL}/user/${user.id}`);
        
        console.log("Listed cars API response status:", response.status);
        if (response.ok) {
            myVehicles = await response.json();
            console.log("Fetched listed cars:", myVehicles);
            renderVehicles();
        } else {
            console.error("Failed to fetch listed cars. Status:", response.status);
            myVehicles = [];
            renderVehicles();
        }
    } catch (err) {
        console.error("Fetch listed cars fatal error:", err);
        myVehicles = [];
        renderVehicles();
    }
}

function renderVehicles() {
    const vehiclesGrid = document.getElementById('vehicles-grid');
    if (!vehiclesGrid) return;

    if (!Array.isArray(myVehicles) || myVehicles.length === 0) {
        vehiclesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 48px; margin-bottom: 20px;"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></div>
                <h3 style="color: var(--text-main); margin-bottom: 10px;">No Vehicles Listed</h3>
                <p style="color: var(--text-sub); margin-bottom: 20px;">You haven't listed any vehicles yet.</p>
                <button class="add-vehicle-btn" onclick="window.location.href='listing.html'" style="padding: 10px 20px; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer;">List Your Vehicle</button>
            </div>
        `;
        return;
    }

    vehiclesGrid.innerHTML = myVehicles.map((vehicle, index) => `
        <div class="vehicle-card" onclick="openVehicleDetails(${index})">
            <img src="${vehicle.imageUrl || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80'}" alt="${vehicle.name}" class="vehicle-card-image" style="width: 100%; height: 180px; object-fit: cover;">
            <div style="padding: 15px;">
                <h4 style="margin: 0 0 5px 0; font-size: 18px;">${vehicle.name}</h4>
                <p style="color: var(--text-sub); font-size: 14px; margin-bottom: 12px;">${vehicle.type} • ${vehicle.fuelType}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 700; color: var(--primary-gradient);">₹${vehicle.pricePerDay}/day</span>
                    <span class="status ${(vehicle.status || '').toLowerCase()}" style="padding: 4px 10px; border-radius: 20px; font-size: 12px;">${vehicle.status}</span>
                </div>
            </div>
        </div>
    `).join('');
}

async function openVehicleDetails(index) {
    const vehicle = myVehicles[index];
    currentActiveVehicle = vehicle;
    document.getElementById('modalVehicleImage').src = vehicle.imageUrl || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80';
    document.getElementById('modalVehicleName').textContent = vehicle.name;
    
    const historyBody = document.getElementById('vehicle-history-body');
    if (historyBody) {
        historyBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Loading history...</td></tr>';
        try {
            const apiHost = window.location.hostname || '127.0.0.1';
            const response = await fetch(`http://${apiHost}:8080/api/cars/${vehicle.id}/history`);
            if (response.ok) {
                const history = await response.json();
                if (history.length === 0) {
                    historyBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No rental history yet.</td></tr>';
                } else {
                    historyBody.innerHTML = history.map(item => {
                        const displayId = item.renterDisplayId || (item.renterId ? 'TGO-' + item.renterId : 'Unknown');
                        const journeyData = {
                            destination: item.destination,
                            durationDays: item.durationDays,
                            startDate: item.startDate,
                            endDate: item.endDate
                        };
                        return `
                            <tr style="cursor: pointer;" onclick='openUserProfile(${item.renterId || "null"}, ${JSON.stringify(journeyData).replace(/'/g, "\\'")})'>
                                <td style="color: #2563eb; text-decoration: underline;">${displayId}</td>
                                <td>${item.startDate} to ${item.endDate}</td>
                                <td style="color: #64748b;">${item.destination || 'Not Specified'}</td>
                                <td style="font-weight: 600;">₹${(item.totalAmount || 0).toLocaleString('en-IN')}</td>
                            </tr>
                        `;
                    }).join('');
                }
            }
        } catch (err) {
            console.error("History fetch error:", err);
            historyBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Failed to load history.</td></tr>';
        }
    }
    
    const modal = document.getElementById('vehicleModalOverlay');
    if (modal) modal.classList.add('active');
}

function closeVehicleModal() {
    const modal = document.getElementById('vehicleModalOverlay');
    if (modal) modal.classList.remove('active');
}

function openEditModal() {
    if (!currentActiveVehicle) return;
    
    document.getElementById('edit-vehicle-id').value = currentActiveVehicle.id;
    document.getElementById('edit-name').value = currentActiveVehicle.name;
    document.getElementById('edit-price').value = currentActiveVehicle.pricePerDay;
    document.getElementById('edit-location').value = currentActiveVehicle.location;
    document.getElementById('edit-fuel').value = currentActiveVehicle.fuelType || 'Petrol';
    document.getElementById('edit-hub').value = currentActiveVehicle.nearbyHub || '';
    document.getElementById('edit-status').value = currentActiveVehicle.status;
    
    const modal = document.getElementById('editVehicleModalOverlay');
    if (modal) modal.classList.add('active');
    closeVehicleModal();
}

function closeEditModal() {
    const modal = document.getElementById('editVehicleModalOverlay');
    if (modal) modal.classList.remove('active');
}

async function deleteVehicle() {
    if (!currentActiveVehicle) return;
    if (confirm(`Are you sure you want to delete "${currentActiveVehicle.name}"? This action cannot be undone.`)) {
        try {
            const apiHost = window.location.hostname || '127.0.0.1';
            const response = await fetch(`http://${apiHost}:8080/api/cars/${currentActiveVehicle.id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                // Notify Admin
                await fetch(`http://${apiHost}:8080/api/messages/sendDirect`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipientId: 1, // Admin
                        senderId: user.id || 1,
                        senderName: user.fullName || "System",
                        senderEmail: user.email || "system@tripgo.com",
                        carName: currentActiveVehicle.name,
                        type: 'CAR_DELETED'
                    })
                });
                alert("Vehicle deleted successfully!");
                closeVehicleModal();
                fetchListedCars();
            } else {
                alert("Failed to delete vehicle.");
            }
        } catch (err) {
            console.error("Delete error:", err);
        }
    }
}

// --- Handover Management ---
let activeHandovers = [];

async function fetchHandovers() {
    try {
        const apiHost = window.location.hostname || '127.0.0.1';
        const response = await fetch(`http://${apiHost}:8080/api/handovers`);
        if (response.ok) {
            const data = await response.json();
            activeHandovers = data.reverse(); 
            renderHandovers();
        }
    } catch (err) {
        console.error("Fetch handovers error:", err);
    }
}

function renderHandovers() {
    const handoversGrid = document.getElementById('handovers-grid');
    if (!handoversGrid) return;

    const user = JSON.parse(localStorage.getItem('user'));
    const displayedHandovers = activeHandovers.filter(h => {
        // Removed hardcoded model exclusions to show all cars
        // if (h.carModel.toLowerCase().includes('tata tiago') || h.carModel.toLowerCase().includes('tata tago')) return false;
        
        let meta = {};
        try { meta = JSON.parse(h.notes || '{}'); } catch(e) {}
        
        const initiatorEmail = (h.renterEmail || meta.initiatedByEmail || '').toLowerCase();
        const takerEmail = (h.takerEmail || '').toLowerCase();
        const myEmail = (user.email || '').toLowerCase();
        
        console.log(`DEBUG: Checking handover ${h.carModel} (#${h.id}). Initiator: ${initiatorEmail}, Taker: ${takerEmail}, Me: ${myEmail}`);
        
        // Show if I am the one who listed it OR the one who accepted it
        return (initiatorEmail === myEmail) || (takerEmail === myEmail);
    });

    if (displayedHandovers.length === 0) {
        handoversGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 48px; margin-bottom: 20px;"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3-6 6"/><path d="m21 16-1.5-1.5"/><path d="m4 21 8-8"/><path d="m8 19 2.5-2.5a1 1 0 1 1 3 3l-3.88 3.88a3 3 0 0 1-4.24 0z"/></svg></div>
                <h3 style="color: var(--text-main); margin-bottom: 10px;">No Handovers Yet</h3>
                <p style="color: var(--text-sub); margin-bottom: 20px;">You haven't listed any cars for handover or accepted any trips yet.</p>
            </div>
        `;
        return;
    }

    handoversGrid.innerHTML = displayedHandovers.map(h => {
        let meta = {};
        try { meta = JSON.parse(h.notes || '{}'); } catch(e) {}
        const initiatorEmail = (h.renterEmail || meta.initiatedByEmail || '').toLowerCase();
        const myEmail = (user.email || '').toLowerCase();
        
        const isMine = initiatorEmail === myEmail;
        let status = 'Listed';
        if (h.takerId) status = 'Booked';

        const carImg = h.carImage || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80';
        const roleLabel = isMine ? 'MY LISTING' : 'ACCEPTED TRIP';
        const roleColor = isMine ? '#2563eb' : '#10b981';

        return `
        <div class="h-card-v3" style="${isMine ? 'border: 2px solid #2563eb;' : ''}">
            <div class="h-card-image-box">
                <span style="position: absolute; top: 10px; right: 10px; background: ${roleColor}; color: white; padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 800; z-index: 2;">${roleLabel}</span>
                <img src="${carImg}" alt="${h.carModel}">
            </div>
            <div class="h-card-v3-body">
                <h4 class="h-card-v3-title">${h.carModel}</h4>
                <div class="h-card-v3-dates">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>${h.pickupDate} <span style="margin: 0 4px; color: #94a3b8;">→</span> ${h.returnDate}</span>
                </div>
                
                <div class="h-card-v3-row">
                    <span class="h-card-v3-label">TOTAL AMOUNT</span>
                    <span class="h-card-v3-amount">₹${h.costSharing}</span>
                </div>

                <div class="h-card-v3-row" style="border-top: none; padding-top: 0; margin-bottom: 10px;">
                    <span class="h-card-v3-label">STATUS</span>
                    <span class="h-card-v3-badge ${status.toLowerCase()}">${status}</span>
                </div>
            </div>

            <div class="h-card-v3-actions">
                ${!isMine ? `
                    <button class="h-card-v3-btn view" onclick="openHandoverDetailsModal(${h.id})">VIEW DETAILS</button>
                    <button class="h-card-v3-btn contact" onclick="window.location.href='mailto:${h.renterEmail}?subject=Trip Handover Query: ${h.carModel}'">CONTACT</button>
                ` : `
                    <button class="h-card-v3-btn view" onclick="editHandoverListing(${h.id})">EDIT</button>
                    <button class="h-card-v3-btn contact" style="border-color: #ef4444; color: #ef4444;" onclick="deleteHandoverListing(${h.id})">DELETE</button>
                `}
            </div>
        </div>
        `;
    }).join('');
}

async function acceptHandover(id) {
    if(!confirm("Are you sure you want to accept this trip handover? You will be responsible for returning the car to the destination.")) return;
    
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const apiHost = window.location.hostname || '127.0.0.1';
        
        // 1. Fetch handover details to get initiator info
        const hRes = await fetch(`http://${apiHost}:8080/api/handovers`);
        if (hRes.ok) {
            const handovers = await hRes.json();
            const h = handovers.find(item => item.id === id);
            
            if (h) {
                // Update handover status to APPROVED
                let meta = {};
                try {
                    meta = JSON.parse(h.notes || '{}');
                } catch(e) {}
                meta.status = 'BOOKED';
                meta.acceptedBy = user.id;
                meta.acceptedByName = user.fullName;
                
                await fetch(`http://${apiHost}:8080/api/handovers/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        notes: JSON.stringify(meta),
                        takerId: user.id,
                        takerName: user.fullName,
                        takerEmail: user.email
                    })
                });

                // 2. Send confirmation to the taker (the person who accepted it)
                await fetch(`http://${apiHost}:8080/api/messages/sendDirect`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipientId: user.id,
                        senderId: 1,
                        senderName: "TripGo System",
                        senderEmail: "support@tripgo.com",
                        carName: h.carModel,
                        origin: h.pickupLocation,
                        destination: h.destination,
                        startDate: h.pickupDate,
                        endDate: h.returnDate,
                        type: 'HANDOVER'
                    })
                });

                // 3. Notify Admin
                await fetch(`http://${apiHost}:8080/api/messages/sendDirect`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipientId: 1, // Admin
                        senderId: user.id,
                        senderName: user.fullName,
                        senderEmail: user.email,
                        carName: h.carModel,
                        origin: h.pickupLocation,
                        destination: h.destination,
                        startDate: h.pickupDate,
                        endDate: h.returnDate,
                        type: 'HANDOVER_ACCEPTED'
                    })
                });

                // 4. Send actual Emails
                // To the Taker (User who accepted)
                const takerSubject = `TripGo: Handover Trip Accepted! - ${h.carModel}`;
                const takerMsg = `Hi ${user.fullName},\n\n` +
                                 `You have successfully accepted a handover trip for ${h.carModel}.\n` +
                                 `Pickup: ${h.pickupLocation} (${h.pickupDate})\n` +
                                 `Destination: ${h.destination} (${h.returnDate})\n\n` +
                                 `Please coordinate with the original renter (${h.renterName} at ${h.renterEmail}) for the handover.\n\n` +
                                 `Happy Driving!`;
                await sendEmail(user.email, takerSubject, takerMsg);

                // To the Initiator (Original Renter)
                const initiatorSubject = `TripGo: Your Handover Listing has been Accepted!`;
                const initiatorMsg = `Hi ${h.renterName},\n\n` +
                                     `Great news! ${user.fullName} has accepted your handover listing for ${h.carModel}.\n\n` +
                                     `Accepted By: ${user.fullName} (${user.email})\n` +
                                     `Trip: ${h.pickupLocation} to ${h.destination}\n\n` +
                                     `Please get in touch to coordinate the hand-off.`;
                await sendEmail(h.renterEmail, initiatorSubject, initiatorMsg);
            }
        }
        
        alert("Handover accepted successfully! Please coordinate pickup details.");
        fetchHandovers();
    } catch (err) { console.error("Accept handover error:", err); }
}

async function cancelHandover(id) {
    if(!confirm("Cancel this handover listing?")) return;
    try {
        const apiHost = window.location.hostname || '127.0.0.1';
        const res = await fetch(`http://${apiHost}:8080/api/handovers/${id}`, { method: 'DELETE' });
        if (res.ok) {
            alert("Handover cancelled and deleted.");
            fetchHandovers();
        }
    } catch (err) { console.error("Cancel handover error:", err); }
}

async function openHandoverDetailsModal(id) {
    const user = JSON.parse(localStorage.getItem('user'));
    const h = activeHandovers.find(item => item.id == id);
    if (!h) return;

    let meta = {};
    try { meta = JSON.parse(h.notes || '{}'); } catch(e) {}
    
    const myEmail = user.email.toLowerCase();
    const initiatorEmail = (h.renterEmail || meta.initiatedByEmail || '').toLowerCase();
    const takerEmail = (h.takerEmail || '').toLowerCase();
    
    const isMine = (initiatorEmail === myEmail);
    const isTaker = (takerEmail === myEmail);
    
    let status = (meta.status || 'LISTED').toUpperCase();
    if (h.takerId) status = 'BOOKED';
    if (status === 'PENDING') status = 'LISTED';

    document.getElementById('hModalImage').src = h.carImage || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80';
    document.getElementById('hModalCar').textContent = h.carModel;
    document.getElementById('hModalRenter').textContent = h.renterName;
    document.getElementById('hModalDuration').textContent = `${h.pickupDate} to ${h.returnDate}`;
    document.getElementById('hModalDest').textContent = h.destination;
    document.getElementById('hModalStatus').innerHTML = `<span class="h-card-v3-badge ${status.toLowerCase()}">${status}</span>`;

    const recipientRow = document.getElementById('hModalRecipientRow');
    if (meta.acceptedByName) {
        recipientRow.style.display = 'flex';
        document.getElementById('hModalRecipient').textContent = meta.acceptedByName;
    } else {
        recipientRow.style.display = 'none';
    }

    const actionsDiv = document.getElementById('hModalActions');
    actionsDiv.innerHTML = '';

    if (isMine) {
        actionsDiv.innerHTML = `
            <button class="action-btn primary" style="flex: 1;" onclick="editHandoverListing(${id})">EDIT LISTING</button>
            <button class="action-btn secondary" style="flex: 1; border-color: #ef4444; color: #ef4444;" onclick="deleteHandoverListing(${id})">DELETE</button>
        `;
    } else if (isTaker) {
        actionsDiv.innerHTML = `
            <button class="action-btn primary" style="width: 100%; background: #10b981; color: white; border: none; border-radius: 12px; height: 50px; font-weight: 700; cursor: pointer;" 
                    onclick="window.location.href='mailto:${h.renterEmail}?subject=Trip Handover Query: ${h.carModel}'">
                CONTACT OWNER / RENTER
            </button>
            <button class="action-btn secondary" style="width: 100%; margin-top: 10px; border-radius: 12px; height: 45px; cursor: pointer;" onclick="closeHandoverDetailsModal()">CLOSE</button>
        `;
    } else if (status === 'LISTED' || status === 'PENDING') {
        actionsDiv.innerHTML = `
            <button class="action-btn primary" style="width: 100%; height: 50px; font-size: 18px; font-weight: 800; background: var(--primary-gradient); color: white; border: none; border-radius: 12px; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);" 
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(37, 99, 235, 0.4)';" 
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(37, 99, 235, 0.3)';"
                    onclick="acceptHandover(${id})">
                TAKE TRIP NOW
            </button>
        `;
    } else {
        actionsDiv.innerHTML = `
            <button class="action-btn secondary" style="width: 100%;" onclick="closeHandoverDetailsModal()">CLOSE</button>
        `;
    }

    document.getElementById('handoverDetailsModalOverlay').classList.add('active');
}

function closeHandoverDetailsModal() {
    document.getElementById('handoverDetailsModalOverlay').classList.remove('active');
}

async function deleteHandoverListing(id) {
    if (!confirm("Are you sure you want to delete this handover listing? This action cannot be undone.")) return;
    try {
        const apiHost = window.location.hostname || '127.0.0.1';
        const res = await fetch(`http://${apiHost}:8080/api/handovers/${id}`, { method: 'DELETE' });
        if (res.ok) {
            alert("Handover listing deleted successfully.");
            closeHandoverDetailsModal();
            fetchHandovers();
        } else {
            alert("Failed to delete listing.");
        }
    } catch (err) { console.error("Delete handover error:", err); }
}

function editHandoverListing(id) {
    window.location.href = `handover.html?handoverId=${id}`;
}

// --- View Switching ---
function switchView(view) {
    console.log("Switching view to:", view);
    const views = ['dashboard-view', 'vehicles-view', 'bookings-view', 'handovers-view', 'messages-view', 'transactions-view'];
    const navItems = document.querySelectorAll('.nav-item');
    
    // Hide all views
    views.forEach(v => {
        const el = document.getElementById(v);
        if (el) el.style.display = 'none';
    });
    
    // Deactivate all nav items
    navItems.forEach(n => n.classList.remove('active'));

    // Show target view
    const targetView = document.getElementById(`${view}-view`);
    if (targetView) targetView.style.display = 'block';

    // Activate target nav item
    const btns = {
        'dashboard': 'btn-dashboard',
        'vehicles': 'btn-vehicles',
        'bookings': 'btn-bookings-nav',
        'handovers': 'btn-handovers-nav',
        'messages': 'btn-messages-nav',
        'transactions': 'btn-transactions-nav'
    };
    
    const targetBtnId = btns[view];
    if (targetBtnId) {
        const btn = document.getElementById(targetBtnId);
        if (btn) btn.classList.add('active');
    }
    
    // Load data as needed
    if (view === 'vehicles') fetchListedCars();
    if (view === 'bookings' || view === 'dashboard') fetchDashboardStats();
    if (view === 'handovers') fetchHandovers();
    if (view === 'messages') fetchMessages();
    if (view === 'transactions' && typeof renderTransactions === 'function') renderTransactions();
}

async function fetchMessages(isBackground = false) {
    const user = JSON.parse(localStorage.getItem('user'));
    const apiHost = window.location.hostname || '127.0.0.1';
    const messagesList = document.getElementById('messages-list');
    
    // Only show loading if not a background poll and list is empty
    if (messagesList && !isBackground && messagesList.innerHTML === '') {
        messagesList.innerHTML = '<div style="text-align: center; padding: 20px;">Loading messages...</div>';
    }

    try {
        const response = await fetch(`http://${apiHost}:8080/api/messages/user/${user.id}`);
        if (response.ok) {
            const messages = await response.json();
            
            // Check for new messages if it's a background poll
            if (messages.length > 0) {
                const newestId = messages[0].id; // Messages are sorted Desc by timestamp
                console.log(`POLL DEBUG: Found ${messages.length} messages. NewestID: ${newestId}, LastSeen: ${lastSeenMessageId}`);
                
                // If it's the very first load, just seed the lastSeenId
                if (lastSeenMessageId === null) {
                    console.log("POLL DEBUG: Initializing lastSeenMessageId to " + newestId);
                    lastSeenMessageId = newestId;
                } else if (newestId > lastSeenMessageId) {
                    // Find all messages newer than lastSeenMessageId
                    const newMessages = messages.filter(m => m.id > lastSeenMessageId);
                    console.log(`POLL DEBUG: Triggering ${newMessages.length} new toasts.`);
                    newMessages.forEach(m => {
                        // Only show toast for unread messages
                        if (!m.read) showWowNotification(m);
                    });
                    lastSeenMessageId = newestId;
                }
            } else {
                // If user has no messages, set lastSeenMessageId to 0 so the first new one triggers
                console.log("POLL DEBUG: No messages found for user. Setting baseline to 0.");
                if (lastSeenMessageId === null) lastSeenMessageId = 0;
            }

            renderMessages(messages);
            updateNotificationBadge(messages);
            renderNotificationDropdown(messages);
        }
    } catch (err) {
        console.error("Fetch messages error:", err);
    }
}

// (Duplicates removed)

function renderMessages(messages) {
    const messagesList = document.getElementById('messages-list');
    if (!messagesList) return;

    if (messages.length === 0) {
        messagesList.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; background: white; border-radius: 12px; border: 1px solid #f1f5f9;">
                <div style="font-size: 48px; margin-bottom: 20px; color: #cbd5e1;">✉️</div>
                <h3 style="color: var(--text-main); margin-bottom: 10px;">No Messages Yet</h3>
                <p style="color: var(--text-sub);">When someone books your car or confirms a trip, you'll see details here.</p>
            </div>
        `;
        return;
    }

    messagesList.innerHTML = messages.map(m => {
        const isConfirmation = m.type === 'CONFIRMATION' || m.type === 'BOOKED';
        const isHandover = m.type === 'HANDOVER' || m.type === 'HANDOVER_PROMPT';
        const isCancellation = m.type === 'CANCELLATION';
        const isPrompt = m.type === 'HANDOVER_PROMPT';
        
        let iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>`;
        if (isConfirmation) iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        if (isHandover) iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${isPrompt ? '#2563eb' : '#ea580c'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>`;
        if (isCancellation) iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
        const isEarlyEndReq = m.type === 'EARLY_END_REQUEST';
        const isEarlyEndDone = m.type === 'EARLY_COMPLETED';

        if (isEarlyEndReq) iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
        if (isEarlyEndDone) iconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

        return `
        <div class="message-card" style="background: white; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 20px; transition: transform 0.2s;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                <div style="display: flex; gap: 15px; align-items: center;">
                    <div style="width: 48px; height: 48px; border-radius: 12px; background: ${isConfirmation ? '#ecfdf5' : (isCancellation ? '#fef2f2' : (isPrompt ? '#eff6ff' : (isHandover ? '#fff7ed' : '#eef2ff')))}; display: flex; align-items: center; justify-content: center; font-size: 24px;">
                        ${iconSvg}
                    </div>
                    <div>
                        <span style="display: inline-block; padding: 2px 8px; background: ${isConfirmation ? '#ecfdf5' : (isCancellation ? '#fef2f2' : (isPrompt ? '#eff6ff' : (isHandover ? '#fff7ed' : (isEarlyEndReq ? '#fffbeb' : (isEarlyEndDone ? '#ecfdf5' : '#eef2ff')))))}; color: ${isConfirmation ? '#059669' : (isCancellation ? '#b91c1c' : (isPrompt ? '#2563eb' : (isHandover ? '#ea580c' : (isEarlyEndReq ? '#b45309' : (isEarlyEndDone ? '#059669' : '#4f46e5')))))}; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                            ${isConfirmation ? 'BOOKED' : (isCancellation ? 'CANCELLED' : (isPrompt ? 'HANDOVER PROMPT' : (isEarlyEndReq ? 'EARLY END REQUEST' : (isEarlyEndDone ? 'EARLY COMPLETED' : (m.type || 'NEW BOOKING')))))}
                        </span>
                        <h4 style="margin: 0; font-size: 20px; color: #1e293b; font-weight: 700;">${isPrompt ? 'Handover your car and earn!' : (isEarlyEndReq ? 'Early Completion Requested' : (isEarlyEndDone ? 'Trip Ended Early!' : m.carName))}</h4>
                    </div>
                </div>
                <div style="text-align: right;">
                    <small style="color: #94a3b8; font-weight: 500;">${new Date(m.timestamp).toLocaleString()}</small>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 25px;">
                <div style="background: #f8fafc; padding: 18px; border-radius: 12px; border: 1px solid #f1f5f9;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <p style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">${isConfirmation ? 'SYSTEM NOTIFICATION' : 'CONTACT DETAILS'}</p>
                        ${!isConfirmation ? `<button onclick="openUserProfile(${m.senderId})" style="background: #2563eb; color: white; border: none; padding: 4px 12px; border-radius: 6px; font-size: 11px; cursor: pointer; font-weight: 600; transition: background 0.2s;">View Profile</button>` : ''}
                    </div>
                    <div style="display: flex; gap: 12px; align-items: center;">
                         <div style="width: 36px; height: 36px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #475569; font-size: 14px;">
                            ${generateInitials(m.senderName)}
                        </div>
                        <div>
                            <p style="margin: 0; font-weight: 700; color: #1e293b; font-size: 15px;">${m.senderName}</p>
                            <p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b;">${m.senderEmail}</p>
                        </div>
                    </div>
                </div>
                <div style="background: #f8fafc; padding: 18px; border-radius: 12px; border: 1px solid #f1f5f9;">
                    <p style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">TRIP ROUTE & DATES</p>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="flex: 1;">
                            <span style="display: block; font-size: 14px; font-weight: 700; color: #1e293b;">${m.origin || 'N/A'}</span>
                        </div>
                        <div style="color: #cbd5e1;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </div>
                        <div style="flex: 1; text-align: left;">
                            <span style="display: block; font-size: 14px; font-weight: 700; color: #1e293b;">${m.destination || 'N/A'}</span>
                        </div>
                    </div>
                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b; display: flex; align-items: center; gap: 5px;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        ${m.startDate} - ${m.endDate}
                    </p>
                </div>
            </div>
            
            ${isEarlyEndReq ? `
            <div style="display: flex; gap: 12px; margin-top: 15px;">
                <button class="action-btn primary" style="padding: 10px 24px; font-size: 14px; font-weight: 600; border-radius: 8px; background: #16a34a; border: none;" onclick="approveEarlyEnd(${m.id}, ${m.bookingId}, '${m.endDate}')">Approve Request</button>
                <button class="action-btn secondary" style="padding: 10px 24px; font-size: 14px; font-weight: 600; border-radius: 8px; color: #dc2626; border-color: #dc2626;" onclick="rejectEarlyEnd(${m.id})">Decline</button>
            </div>` : ''}

            ${isPrompt ? `
            <div style="display: flex; gap: 12px;">
                <button class="action-btn primary" style="padding: 10px 24px; font-size: 14px; font-weight: 600; border-radius: 8px;" onclick="window.location.href='browsecar.html?mode=handover&car=${encodeURIComponent(m.carName)}&bookingId=${m.bookingId}&prefill=true&origin=${encodeURIComponent(m.origin)}&dest=${encodeURIComponent(m.destination)}&startDate=${m.startDate}&endDate=${m.endDate}'">List Return Journey</button>
            </div>` : 
            (isConfirmation ? `
            <div style="display: flex; gap: 12px;">
                <button class="action-btn primary" style="padding: 10px 24px; font-size: 14px; font-weight: 600; border-radius: 8px;" onclick="window.location.href='browsecar.html'">Explore More Cars</button>
            </div>` : '')}
        </div>
    `}).join('');
}

async function approveEarlyEnd(messageId, bookingId, newEndDate) {
    if (!bookingId || bookingId === 'null' || bookingId === 'undefined') {
        alert("Error: Booking ID is missing. This request may be from an older version of the system.");
        return;
    }
    
    if (!confirm("Are you sure you want to approve this early completion request? The trip will end on " + newEndDate)) return;

    try {
        const apiHost = window.location.hostname || '127.0.0.1';
        const response = await fetch(`http://${apiHost}:8080/api/bookings/${bookingId}/approve-early-completion?newEndDate=${encodeURIComponent(newEndDate)}`, {
            method: 'POST'
        });

        if (response.ok) {
            alert("Early completion approved!");
            // Mark the message as read
            await fetch(`http://${apiHost}:8080/api/messages/${messageId}/read`, { method: 'PATCH' });
            fetchMessages();
            fetchDashboardStats();
        } else {
            const errText = await response.text();
            alert("Failed to approve request: " + errText);
        }
    } catch (err) {
        console.error("Approve early end error:", err);
    }
}

async function rejectEarlyEnd(messageId) {
    if (!confirm("Are you sure you want to decline this request?")) return;
    try {
        const apiHost = window.location.hostname || '127.0.0.1';
        await fetch(`http://${apiHost}:8080/api/messages/${messageId}/read`, { method: 'PATCH' });
        alert("Request declined.");
        fetchMessages();
    } catch (err) { console.error(err); }
}

async function openUserProfile(userId, journeyInfo = null) {
    const modal = document.getElementById('userProfileModalOverlay');
    if (modal) modal.classList.add('active');

    console.log("PROFILE DEBUG: openUserProfile called. User ID:", userId, "Journey Info:", journeyInfo);

    // Show/hide journey details
    const journeyEl = document.getElementById('journeyDetails');
    const journeyDestination = document.getElementById('journeyDestination');
    const journeyDuration = document.getElementById('journeyDuration');

    if (journeyEl) {
        console.log("PROFILE DEBUG: journeyInfo object:", journeyInfo);
        if (journeyInfo && (journeyInfo.destination || journeyInfo.durationDays || journeyInfo.startDate)) {
            journeyEl.style.display = 'block';
            const destText = journeyInfo.destination && journeyInfo.destination !== 'null' ? journeyInfo.destination : 'Not Specified';
            if (journeyDestination) journeyDestination.textContent = destText;
            if (journeyDuration) journeyDuration.textContent = `${journeyInfo.durationDays || '-'} Days`;
            console.log("PROFILE DEBUG: Setting destination text to:", destText);
        } else {
            console.log("PROFILE DEBUG: No journey info found or incomplete, hiding details.");
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
        const apiHost = window.location.hostname || '127.0.0.1';
        const response = await fetch(`http://${apiHost}:8080/api/auth/users/${userId}`);
        
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
        } else {
            alert("Could not fetch user profile details.");
            closeUserModal();
        }
    } catch (err) {
        console.error("Profile fetch error:", err);
        alert("Error connecting to server.");
        closeUserModal();
    }
}

function closeUserModal() {
    const modal = document.getElementById('userProfileModalOverlay');
    if (modal) modal.classList.remove('active');
}

function openInitiateHandover(carId, carName, bookingId, ownerName, ownerEmail, totalAmount, pricePerDay, startDate, endDate, carLocation, carImageUrl, carHub) {
    const url = `browsecar.html?mode=handover&carId=${carId}&car=${encodeURIComponent(carName)}&bookingId=${bookingId}&totalAmount=${totalAmount}&pricePerDay=${pricePerDay}&startDate=${startDate}&endDate=${endDate}&carLocation=${encodeURIComponent(carLocation)}&prefill=true&carHub=${encodeURIComponent(carHub || '')}`;
    window.location.href = url;
}

// Consolidated Initialization Block
function initProfilePage() {
    console.log("Initializing Profile Page...");
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user || (!user.id && !user.adminId)) {
        // Allow home page (index.html) to be public
        const isPublicPage = window.location.pathname.endsWith('index.html') || 
                            window.location.pathname.endsWith('/') || 
                            window.location.pathname === '';
        
        if (isPublicPage) {
            console.log("Public page detected - skipping mandatory authentication check.");
            return;
        }

        console.warn("Invalid session, redirecting to login.html");
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        alert("Your session has expired or is invalid. Please login again.");
        window.location.href = 'login.html';
        return;
    }

    console.log("Logged in as:", user.fullName, "ID:", user.id || user.adminId);
    
    // Add debug info to console for the user to copy-paste
    console.log("DEBUG SESSION DATA:", JSON.stringify(user, null, 2));

    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            toggleDebugOverlay();
        }
    });

    updateAllProfileIcons();
    initNotifications();
    
    // Modal & Form Listeners
    const closeBooking = document.getElementById('closeBookingModal');
    if (closeBooking) closeBooking.onclick = () => document.getElementById('bookingModalOverlay').classList.remove('active');
    
    const closeVehicle = document.getElementById('closeVehicleModal');
    if (closeVehicle) closeVehicle.onclick = closeVehicleModal;
    
    const closeEdit = document.getElementById('closeEditModal');
    if (closeEdit) closeEdit.onclick = closeEditModal;
    
    const editBtn = document.getElementById('edit-vehicle-btn');
    if (editBtn) editBtn.onclick = openEditModal;
    
    const deleteBtn = document.getElementById('delete-vehicle-btn');
    if (deleteBtn) deleteBtn.onclick = deleteVehicle;

    const editForm = document.getElementById('editVehicleForm');
    if (editForm) {
        editForm.onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-vehicle-id').value;
            const updatedData = {
                name: document.getElementById('edit-name').value,
                pricePerDay: parseInt(document.getElementById('edit-price').value),
                location: document.getElementById('edit-location').value,
                fuelType: document.getElementById('edit-fuel').value,
                nearbyHub: document.getElementById('edit-hub').value,
                status: document.getElementById('edit-status').value,
                type: currentActiveVehicle?.type,
                imageUrl: currentActiveVehicle?.imageUrl
            };
            try {
                const apiHost = window.location.hostname || '127.0.0.1';
                const response = await fetch(`http://${apiHost}:8080/api/cars/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData)
                });
                if (response.ok) {
                    alert("Vehicle updated successfully!");
                    closeEditModal();
                    fetchListedCars();
                    if (typeof fetchDashboardStats === 'function') fetchDashboardStats();
                }
            } catch (err) { console.error(err); }
        };
    }


    // Sidebar Navigation Listeners
    const navMapping = {
        'btn-dashboard': 'dashboard',
        'btn-vehicles': 'vehicles',
        'btn-bookings-nav': 'bookings',
        'btn-handovers-nav': 'handovers',
        'btn-messages-nav': 'messages',
        'btn-transactions-nav': 'transactions'
    };

    Object.keys(navMapping).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.onclick = (e) => {
                e.preventDefault();
                switchView(navMapping[btnId]);
            };
        }
    });

    // Initial data load
    fetchDashboardStats();
    
    // Check if we started on a specific tab (optional, can be expanded)
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get('view');
    if (view && ['vehicles', 'bookings', 'handovers'].includes(view)) {
        switchView(view);
    }
}

function toggleDebugOverlay() {
    let overlay = document.getElementById('debug-overlay');
    if (overlay) {
        overlay.remove();
        return;
    }
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    overlay = document.createElement('div');
    overlay.id = 'debug-overlay';
    overlay.style.cssText = 'position:fixed; bottom:20px; right:20px; width:300px; background:rgba(0,0,0,0.85); color:#0f0; padding:15px; border-radius:10px; font-family:monospace; font-size:12px; z-index:9999; border:1px solid #0f0;';
    
    const apiHost = window.location.hostname || '127.0.0.1';
    
    overlay.innerHTML = `
        <div style="font-weight:bold; border-bottom:1px solid #0f0; margin-bottom:10px; padding-bottom:5px;">TRIPGO DEBUGGER</div>
        <div>User Name: ${user.fullName || 'N/A'}</div>
        <div>User ID: ${user.id || 'MISSING'}</div>
        <div>Role: ${user.role || 'N/A'}</div>
        <div>API Host: ${apiHost}</div>
        <hr style="border:0; border-top:1px solid #333; margin:10px 0;">
        <div id="debug-api-status">API Status: Testing...</div>
        <div style="margin-top:10px;">
            <button onclick="localStorage.clear(); window.location.href='login.html';" style="background:#f00; color:#fff; border:none; padding:5px; width:100%; cursor:pointer; font-weight:bold;">RESET ALL STORAGE</button>
        </div>
        <div style="margin-top:5px; font-size:10px; color:#aaa;">Press Ctrl+Shift+D to close</div>
    `;
    document.body.appendChild(overlay);
    
    fetch(`http://${apiHost}:8080/api/cars`)
        .then(r => {
            document.getElementById('debug-api-status').innerText = `API Status: ${r.ok ? 'ONLINE' : 'ERROR ' + r.status}`;
            document.getElementById('debug-api-status').style.color = r.ok ? '#0f0' : '#f00';
        })
        .catch(e => {
            document.getElementById('debug-api-status').innerText = `API Status: UNREACHABLE`;
            document.getElementById('debug-api-status').style.color = '#f00';
        });
}



// Global scope initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfilePage);
} else {
    initProfilePage();
}


// Sync across tabs
window.addEventListener('storage', (e) => {
    if (e.key === 'user') {
        updateAllProfileIcons();
    }
});
async function renderTransactions() {
    const transactionList = document.getElementById('transaction-list');
    if (!transactionList) return;

    transactionList.innerHTML = '<div style="text-align:center; padding:20px; color:#64748b;">Loading premium transactions...</div>';

    const user = JSON.parse(localStorage.getItem('user'));
    const apiHost = window.location.hostname || '127.0.0.1';

    try {
        const res = await fetch(`http://${apiHost}:8080/api/transactions/user/${user.id}`);
        if (res.ok) {
            const transactions = await res.json();
            
            if (transactions.length === 0) {
                transactionList.innerHTML = `
                    <div style="padding: 40px; text-align: center; color: #94a3b8;">
                        <div style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;">Empty History</div>
                        <p>No transactions found. Earn points by early trip completion!</p>
                    </div>
                `;
                return;
            }

            transactionList.innerHTML = transactions.map(tx => {
                const isPositive = tx.type === 'EARNED';
                const date = new Date(tx.timestamp).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                let icon = '<i class="fa-solid fa-coins"></i>';
                let iconColor = '#3b82f6';
                let iconBg = '#dbeafe';

                if (tx.type === 'EARNED') {
                    icon = '<i class="fa-solid fa-arrow-trend-up"></i>';
                    iconColor = '#10b981';
                    iconBg = '#dcfce7';
                } else if (tx.type === 'CONVERTED') {
                    icon = '<i class="fa-solid fa-ticket"></i>';
                    iconColor = '#8b5cf6';
                    iconBg = '#ede9fe';
                } else if (tx.type === 'REDEEMED') {
                    icon = '<i class="fa-solid fa-cart-shopping"></i>';
                    iconColor = '#ef4444';
                    iconBg = '#fee2e2';
                }

                return `
                    <div class="premium-transaction-item">
                        <div class="tx-info">
                            <div class="tx-icon" style="background: ${iconBg}; color: ${iconColor};">
                                ${icon}
                            </div>
                            <div class="tx-details">
                                <h4>${tx.source}</h4>
                                <p>${date} • ${tx.details}</p>
                            </div>
                        </div>
                        <div class="tx-amount ${isPositive ? 'positive' : 'negative'}">
                            ${isPositive ? '+' : '-'}${parseFloat(tx.amount).toLocaleString()} Points
                        </div>
                    </div>
                `;
            }).join('') + `
                <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 0.85rem; border-top: 1px dashed #e2e8f0; margin-top: 10px;">
                    <p>Transaction history is up to date.</p>
                </div>
            `;
        } else {
            transactionList.innerHTML = '<div style="text-align:center; padding:20px; color:#ef4444;">Could not fetch history.</div>';
        }
    } catch (err) {
        console.error("Error rendering transactions:", err);
        transactionList.innerHTML = '<div style="text-align:center; padding:20px; color:#ef4444;">Error loading transactions.</div>';
    }
}

