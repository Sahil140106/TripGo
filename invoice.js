document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('id');
    const user = JSON.parse(localStorage.getItem('user'));

    console.log("DEBUG: Loading invoice for booking ID:", bookingId);

    if (!bookingId || bookingId === 'undefined') {
        document.body.innerHTML = `<div style="text-align:center; padding:50px;">
            <h2>Invoice Error</h2>
            <p>Invalid or missing Booking ID.</p>
            <button onclick="window.history.back()">Go Back</button>
        </div>`;
        return;
    }

    try {
        const response = await fetch(`${BOOKING_API_URL}/${bookingId}`);
        if (!response.ok) {
            console.error("DEBUG: Fetch failed for ID", bookingId, "Status:", response.status);
            throw new Error(`Booking ${bookingId} not found`);
        }
        const booking = await response.json();

        const carRes = await fetch(`${CAR_API_URL}/${booking.carId}`);
        const car = carRes.ok ? await carRes.json() : { name: "Car Title" };

        // Meta
        document.getElementById('invNumber').textContent = `TG-${booking.id}`;
        document.getElementById('invDate').textContent = new Date().toLocaleDateString('en-GB');
        document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-GB');

        // User & Trip Locations
        document.getElementById('userName').textContent = user ? user.fullName : "Customer";
        document.getElementById('userEmail').textContent = user ? user.email : "N/A";
        
        // Show Pickup Location as Address
        const pickupAddr = booking.origin || car.nearbyHub || car.location || "N/A";
        document.getElementById('userAddress').textContent = pickupAddr;
        document.getElementById('signatureName').textContent = user ? user.fullName : "Customer";

        // Status
        let statusText = "REGULAR";
        if (booking.isHandoverBooking) statusText = "HANDOVER";
        if (booking.isEarlyCompleted) statusText = "EARLY COMPLETION";
        const statusEl = document.getElementById('tripStatus');
        statusEl.textContent = statusText;
        statusEl.className = `status-badge ${statusText.toLowerCase().replace(' ', '-')}`;

        // Table
        const start = new Date(booking.startDate);
        const end = new Date(booking.endDate);
        const diffDays = Math.max(1, Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)));
        const rate = booking.pricePerDay || 0;
        const subtotal = rate * diffDays;

        document.getElementById('rentalTableBody').innerHTML = `
            <tr>
                <td><strong>${car.name}</strong><br><small>Destination: ${booking.destination || 'N/A'}</small></td>
                <td>${booking.startDate} to ${booking.endDate}</td>
                <td>₹${rate.toLocaleString()}</td>
                <td>${diffDays}</td>
                <td>₹${subtotal.toLocaleString()}</td>
            </tr>
        `;

        document.getElementById('rentalSubtotal').textContent = `₹${subtotal.toLocaleString()}`;
        document.getElementById('refundableDeposit').textContent = `₹${(booking.refundableDeposit || 0).toLocaleString()}`;
        
        if (booking.deliveryCharge > 0) {
            const deliveryRow = document.getElementById('deliveryRow');
            if (deliveryRow) {
                deliveryRow.style.display = 'table-row';
                document.getElementById('deliveryCharge').textContent = `₹${booking.deliveryCharge.toLocaleString()}`;
            }
        }

        if (booking.discountAmount > 0) {
            const dr = document.getElementById('discountRow');
            if (dr) {
                dr.style.display = 'table-row';
                document.getElementById('discountAmount').textContent = `-₹${booking.discountAmount.toLocaleString()}`;
                
                const pcl = document.getElementById('promoCodeLabel');
                if (pcl) {
                    pcl.textContent = booking.promoCode ? `(Promo Code: ${booking.promoCode})` : "(Loyalty/System Discount)";
                    pcl.style.color = "#22c55e";
                    pcl.style.marginLeft = "10px";
                    pcl.style.fontSize = "12px";
                }
            }
        }

        document.getElementById('grandTotal').textContent = `₹${booking.totalAmount.toLocaleString()}`;
        document.getElementById('paymentStatus').textContent = booking.status || "SUCCESS";

    } catch (err) {
        console.error("FATAL ERROR in invoice.js:", err);
        alert(`Load failed: ${err.message}. Please check if the backend server is running and the booking ID is correct.`);
        
        // Also show error on page
        const container = document.getElementById('invoice');
        if (container) {
            container.innerHTML = `
                <div style="text-align:center; padding:50px; color:#ef4444;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size:48px; margin-bottom:20px;"></i>
                    <h2>Oops! Something went wrong</h2>
                    <p>${err.message}</p>
                    <p style="font-size:12px; color:#94a3b8; margin-top:10px;">Check console for details. Path: ${BOOKING_API_URL}/${bookingId}</p>
                    <br>
                    <button onclick="window.history.back()" style="padding:10px 20px; border-radius:8px; background:var(--primary); color:white; border:none; cursor:pointer;">Go Back</button>
                </div>
            `;
        }
    }
});
