document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const storedBooking = sessionStorage.getItem('currentBooking');
    const booking = storedBooking ? JSON.parse(storedBooking) : {};

    const carId = urlParams.get('id') || booking.id || '123';
    const carName = urlParams.get('name') || booking.name || 'TOYOTA INNOVA CRYSTA';
    const carPriceRaw = urlParams.get('price') || booking.price;
    let carPrice = 5000; // Default fallback
    if (carPriceRaw !== null && carPriceRaw !== undefined) {
        const parsed = parseInt(carPriceRaw.toString().replace(/,/g, ''));
        if (!isNaN(parsed)) {
            carPrice = parsed;
        }
    }
    
    const carImg = booking.img || urlParams.get('img') || 'https://stimg.cardekho.com/images/carexteriorimages/930x620/Toyota/Innova-Crysta/10706/1701931885565/front-left-side-47.jpg';
    const carType = booking.type || urlParams.get('type') || 'SUV';
    const origin = booking.origin || urlParams.get('origin') || 'Mumbai';
    const dest = booking.dest || urlParams.get('dest') || 'Pune';
    const pickupDateStr = booking.pickup || urlParams.get('pickup') || new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const returnDateStr = booking.returnDate || urlParams.get('return') || new Date(Date.now() + 86400000 * 16).toISOString().split('T')[0];
    const fuel = booking.fuel || urlParams.get('fuel') || 'Diesel';
    const trans = booking.trans || urlParams.get('trans') || 'Manual';
    const seats = booking.seats || urlParams.get('seats') || '7';
    const luggage = urlParams.get('luggage') || booking.luggage || '2';
    const handover = (urlParams.get('handover') === 'true' || booking.handover === true || booking.handover === 'true');
    const fuelIncludedParam = urlParams.get('fuelIncluded') === 'true';
    const refundableDeposit = parseInt(urlParams.get('deposit')) || parseInt(booking.deposit) || 3000;

    // Update Basic Info
    const carNameEl = document.getElementById('carName');
    const carImageEl = document.getElementById('carImage');
    const tripLocationEl = document.getElementById('tripLocation');
    const carTypeBadgeEl = document.getElementById('carTypeBadge');

    if (carNameEl) carNameEl.innerText = carName.toUpperCase();
    if (carImageEl) carImageEl.src = carImg;
    if (tripLocationEl) tripLocationEl.innerText = origin;
    if (carTypeBadgeEl) carTypeBadgeEl.innerText = carType.toUpperCase();
    
    // Update Features
    const transTypeEl = document.getElementById('transmissionType');
    const fuelTypeEl = document.getElementById('fuelType');
    const seatingCapEl = document.getElementById('seatingCapacity');
    const luggageCapEl = document.getElementById('luggageCapacity');

    if (transTypeEl) transTypeEl.innerText = trans;
    if (fuelTypeEl) fuelTypeEl.innerText = fuel;
    if (seatingCapEl) seatingCapEl.innerText = seats;
    if (luggageCapEl) luggageCapEl.innerText = `${luggage} Large Bags`;

    // Toggle Handover Card
    const handoverCard = document.querySelector('.handover-box');
    if (handoverCard) {
        if (handover) {
            handoverCard.style.display = 'block';
        } else {
            handoverCard.style.display = 'none';
        }
    }

    // Dates and Duration Calculation Logic
    const pickupInput = document.getElementById('pickupDateInput');
    const returnInput = document.getElementById('returnDateInput');
    const destinationInput = document.getElementById('tripDestinationSelect');
    const durationEl = document.getElementById('duration');
    const rentalChargesEl = document.getElementById('rentalCharges');
    const gstEl = document.getElementById('gst');
    const totalAmountEl = document.getElementById('totalAmount');
    const payBtn = document.getElementById('payBtn');
    const pickupLocationSelect = document.getElementById('pickupLocationSelect');

    // Handle Handover Lock
    if (booking.isHandoverBooking) {
        if (tripLocationEl) tripLocationEl.innerText = origin;
        if (destinationInput) {
            destinationInput.value = dest;
            destinationInput.readOnly = true;
            destinationInput.style.backgroundColor = '#f1f5f9';
            destinationInput.style.color = '#1e293b';
            destinationInput.style.cursor = 'not-allowed';
            destinationInput.style.opacity = '1';
        }
        if (pickupLocationSelect) {
            pickupLocationSelect.value = 'hub';
            pickupLocationSelect.disabled = true;
            pickupLocationSelect.style.backgroundColor = '#f1f5f9';
            pickupLocationSelect.style.cursor = 'not-allowed';
        }

        // Hide sections not relevant for Join-Trip Handover
        const pickupCard = document.getElementById('pickupDetailsCard');
        if (pickupCard) pickupCard.style.display = 'none';

        const benefitCard = document.getElementById('handoverBenefitCard');
        if (benefitCard) benefitCard.style.display = 'none';
        
        const handoverStatusText = document.getElementById('handoverStatusText');
        if (handoverStatusText) handoverStatusText.style.display = 'none';
        
        // Restrict Dates to Handover Window
        const windowStart = booking.handoverStart || urlParams.get('windowStart') || pickupDateStr;
        const windowEnd = booking.handoverEnd || urlParams.get('windowEnd') || returnDateStr;

        // Initialize inputs precisely
        if (pickupInput) {
            pickupInput.value = pickupDateStr;
            pickupInput.min = windowStart;
            pickupInput.max = windowEnd;
            pickupInput.disabled = false;
        }
        if (returnInput) {
            returnInput.value = returnDateStr;
            returnInput.min = (new Date(pickupDateStr) > new Date(windowStart)) ? pickupDateStr : windowStart;
            returnInput.max = windowEnd;
            returnInput.disabled = false;
        }

        // Add a small notice with the correct window limits
        const summaryBox = document.querySelector('.summary-box');
        if (summaryBox) {
            const notice = document.createElement('div');
            notice.style.cssText = 'background: #fffbeb; border: 1px solid #fef3c7; color: #b45309; padding: 10px; border-radius: 8px; font-size: 12px; margin-bottom: 15px; font-weight: 600;';
            
            let windowText = windowStart + ' to ' + windowEnd;
            if (new Date(windowStart) > new Date(windowEnd)) {
                windowText = '<span style="color: #ef4444;">Invalid Window: ' + windowStart + ' to ' + windowEnd + '</span>';
            }
            
            notice.innerHTML = '<i class="fa-solid fa-calendar-check"></i> Booking must stay within the Handover window (' + windowText + ').';
            summaryBox.insertBefore(notice, summaryBox.childNodes[2]);
        }
    } else {
        // Regular booking initialization
        if (pickupInput) pickupInput.value = pickupDateStr;
        if (returnInput) {
            returnInput.value = returnDateStr;
            returnInput.min = pickupDateStr;
        }
    }
    if (destinationInput) destinationInput.value = dest;

    // Trip Points Logic removed as requested

    // Promo Code Logic
    let promoDiscount = 0;
    let activePromoCode = null;
    const promoInput = document.getElementById('promoCodeInput');
    const applyPromoBtn = document.getElementById('applyPromoBtn');
    const promoMessage = document.getElementById('promoMessage');
    const promoDiscountRow = document.getElementById('promoDiscountRow');
    const promoDiscountVal = document.getElementById('promoDiscountValue');

    if (applyPromoBtn) {
        applyPromoBtn.addEventListener('click', async () => {
            const code = promoInput.value.trim().toUpperCase();
            if (!code) return;

            applyPromoBtn.disabled = true;
            applyPromoBtn.innerText = "Checking...";
            promoMessage.style.display = 'none';

            try {
                const response = await fetch(`${AUTH_API_URL}/vouchers/validate?code=${code}`);
                
                if (response.ok) {
                    const data = await response.json();
                    promoDiscount = parseFloat(data.value);
                    activePromoCode = code;
                    
                    promoMessage.textContent = `Success! ₹${promoDiscount.toLocaleString('en-IN')} discount applied.`;
                    promoMessage.style.color = '#059669';
                    promoMessage.style.display = 'block';
                    
                    recalculateSummary();
                } else {
                    const err = await response.text();
                    promoMessage.textContent = "Invalid code: " + err;
                    promoMessage.style.color = '#ef4444';
                    promoMessage.style.display = 'block';
                    promoDiscount = 0;
                    activePromoCode = null;
                    recalculateSummary();
                }
            } catch (err) {
                console.error("Promo error:", err);
                promoMessage.textContent = "Error validating code.";
                promoMessage.style.color = '#ef4444';
                promoMessage.style.display = 'block';
            } finally {
                applyPromoBtn.disabled = false;
                applyPromoBtn.innerText = "Apply";
            }
        });
    }

    function recalculateSummary() {
        if (!pickupInput || !returnInput) return;

        const start = new Date(pickupInput.value);
        const end = new Date(returnInput.value);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

        // Ensure return date is not before pickup
        if (end < start) {
            returnInput.value = pickupInput.value;
        }

        // Strict Handover Window Enforcements
        if (booking.isHandoverBooking) {
            const windowEnd = booking.handoverEnd || urlParams.get('windowEnd');
            if (windowEnd) {
                const maxDate = new Date(windowEnd);
                if (end > maxDate) {
                    returnInput.value = windowEnd;
                    end.setTime(maxDate.getTime());
                }
            }
        }

        returnInput.min = pickupInput.value;

        const diffTime = Math.abs(end - start);
        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        if (durationEl) durationEl.innerText = `Duration: ${diffDays} Day${diffDays > 1 ? 's' : ''}`;

        // Calculate Pricing
        let deliveryCharge = 0;
        const pickupLocation = document.getElementById('pickupLocationSelect');
        const deliveryRow = document.getElementById('deliveryRow');
        const deliveryChargesEl = document.getElementById('deliveryCharges');

        if (pickupLocation && pickupLocation.value === 'home') {
            deliveryCharge = parseInt(urlParams.get('delivery')) || parseInt(booking.delivery) || 500;
            if (deliveryRow) deliveryRow.style.display = 'flex';
            if (deliveryChargesEl) deliveryChargesEl.innerText = `₹ ${deliveryCharge.toLocaleString('en-IN')}`;
        } else {
            if (deliveryRow) deliveryRow.style.display = 'none';
        }

        const rentalCharges = carPrice * diffDays;
        
        let handoverDiscount = 0;
        const discountRow = document.getElementById('handoverDiscountRow');
        const discountVal = document.getElementById('handoverDiscountValue');

        if (booking.isHandoverBooking) {
            handoverDiscount = Math.floor(rentalCharges * 0.25);
            if (discountRow) discountRow.style.display = 'flex';
            if (discountVal) discountVal.innerText = `- ₹ ${handoverDiscount.toLocaleString('en-IN')}`;
        } else {
            if (discountRow) discountRow.style.display = 'none';
        }

        // Points Discount Logic removed as requested
        let pointsDiscount = 0;

        const deposit = refundableDeposit;
       const fuelIncluded = booking ? (booking.fuelIncluded === true || booking.fuelIncluded === 'true') : fuelIncludedParam;
    
    const fuelStatusTag = document.getElementById('fuel-status-tag');
    if (fuelStatusTag) {
        if (fuelIncluded) {
            fuelStatusTag.textContent = 'Included';
            fuelStatusTag.className = 'status-tag success';
            fuelStatusTag.style.background = '#dcfce7';
            fuelStatusTag.style.color = '#166534';
        } else {
            fuelStatusTag.textContent = 'Not Included';
            fuelStatusTag.className = 'status-tag';
            fuelStatusTag.style.background = '#f1f5f9';
            fuelStatusTag.style.color = '#64748b';
        }
    }
        const total = rentalCharges + deposit + deliveryCharge - handoverDiscount - pointsDiscount - promoDiscount;

        // Update Promo Discount UI
        if (promoDiscountRow && promoDiscount > 0) {
            promoDiscountRow.style.display = 'flex';
            promoDiscountVal.innerText = `- ₹ ${promoDiscount.toLocaleString('en-IN')}`;
        } else if (promoDiscountRow) {
            promoDiscountRow.style.display = 'none';
        }

        // Update Refundable Deposit in UI
        const depositEl = document.getElementById('refundableDepositValue');
        if (depositEl) depositEl.innerText = `₹ ${deposit.toLocaleString('en-IN')}`;

        const dailyPriceValue = document.getElementById('dailyPriceValue');
        const durationValue = document.getElementById('durationValue');
        
        if (dailyPriceValue) dailyPriceValue.innerText = `₹ ${carPrice.toLocaleString('en-IN')}`;
        if (durationValue) durationValue.innerText = `${diffDays} Day${diffDays > 1 ? 's' : ''}`;

        if (rentalChargesEl) rentalChargesEl.innerText = `₹ ${rentalCharges.toLocaleString('en-IN')}`;
        if (totalAmountEl) totalAmountEl.innerText = `₹ ${total.toLocaleString('en-IN')}`;
        if (payBtn) payBtn.innerText = `Pay ₹${total.toLocaleString('en-IN')}`;

        // Save discount info for payment processing
        booking.pointsDiscount = pointsDiscount;

        // Update session storage for redirection consistency
        booking.pickup = pickupInput.value;
        booking.returnDate = returnInput.value;
        booking.dest = destinationInput ? destinationInput.value : booking.dest;
        booking.deliveryMode = pickupLocation ? pickupLocation.value : 'hub';
        sessionStorage.setItem('currentBooking', JSON.stringify(booking));
    }

    if (pickupInput) pickupInput.addEventListener('change', recalculateSummary);
    if (returnInput) returnInput.addEventListener('change', recalculateSummary);
    if (destinationInput) destinationInput.addEventListener('input', recalculateSummary);
    
    if (pickupLocationSelect) pickupLocationSelect.addEventListener('change', recalculateSummary);

    const changeCarBtn = document.getElementById('changeCarBtn');
    if (changeCarBtn) {
        changeCarBtn.addEventListener('click', () => {
            window.location.href = 'browsecar.html';
        });
    }

    // Initial calculation
    recalculateSummary();

    // Pay Button Click
    document.getElementById('payBtn').addEventListener('click', async function() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            alert("Please login to complete booking.");
            window.location.href = 'login.html';
            return;
        }

        const currentTotal = totalAmountEl.innerText.replace('₹', '').replace(/,/g, '').trim();
        const start = pickupInput.value;
        const end = returnInput.value;

        payBtn.disabled = true;
        payBtn.innerText = "Processing...";

        try {
            console.log("PAYMENT DEBUG: Starting booking for User ID:", user.id, "Car ID:", carId);
            
            // 1. Create Booking
            const finalDest = destinationInput ? destinationInput.value : dest;
            const displayDest = booking.isHandoverBooking ? `[HANDOVER] ${finalDest}` : finalDest;

            const bookingPayload = {
                userId: user.id,
                carId: parseInt(carId) || 0,
                startDate: start,
                endDate: end,
                status: 'CONFIRMED',
                pricePerDay: carPrice,
                totalAmount: parseFloat(currentTotal),
                destination: displayDest,
                isHandoverBooking: booking.isHandoverBooking || false
            };
            console.log("PAYMENT DEBUG: Final Booking Payload to be sent:", JSON.stringify(bookingPayload, null, 2));

            const bookingResponse = await fetch(`${baseUrl}/bookings/store`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingPayload)
            });

            if (!bookingResponse.ok) {
                const errText = await bookingResponse.text();
                console.error("PAYMENT DEBUG: Booking Failed:", bookingResponse.status, errText);
                throw new Error("Failed to create booking");
            }
            const savedBooking = await bookingResponse.json();
            console.log("PAYMENT DEBUG: Booking Created Successfully:", savedBooking);

            // 2. Create Payment Record
            const paymentResponse = await fetch(`${baseUrl}/payments/store`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: savedBooking.id,
                    userId: user.id,
                    amount: parseFloat(currentTotal),
                    status: 'SUCCESS'
                })
            });

            if (!paymentResponse.ok) throw new Error("Failed to create payment record");
            console.log("PAYMENT DEBUG: Payment record created successfully.");

            // 2b. Deduct Trip Points Logic removed

            // 3. Update Car Status to BOOKED
            console.log("PAYMENT DEBUG: Updating Car Status to BOOKED for Car ID:", carId);
            const statusResponse = await fetch(`${baseUrl}/cars/${carId}/status?status=BOOKED`, {
                method: 'PATCH'
            });

            if (!statusResponse.ok) {
                console.warn("PAYMENT DEBUG: Car status update failed, but booking was successful.");
            } else {
                console.log("PAYMENT DEBUG: Car status updated to BOOKED successfully.");
            }

            // 3b. Mark Promo Code as Used
            if (activePromoCode) {
                console.log("PAYMENT DEBUG: Using Promo Code:", activePromoCode);
                await fetch(`${baseUrl}/auth/vouchers/use?code=${activePromoCode}`, {
                    method: 'POST'
                });
            }

            // 4. Notifications are now managed by the Backend (BookingController.storeBooking)
            console.log("PAYMENT DEBUG: Notifications handled by Backend.");

            if (handover) {
                alert(`Booking Successful! Since this car supports Trip Handover, you can list your return journey to earn back.`);
                
                const handoverUrl = `browsecar.html?mode=handover&car=${encodeURIComponent(carName)}&prefill=true&origin=${encodeURIComponent(origin)}&dest=${encodeURIComponent(dest)}&carImage=${encodeURIComponent(carImg)}&startDate=${start}&endDate=${end}`;
                
                // Add to local notifications if available
                if (typeof addNotification === 'function') {
                    addNotification(
                        `Trip Confirmed: ${carName}. <a href="${handoverUrl}" style="color: #2563eb; font-weight: 700; text-decoration: underline;">List for Reverse Renting</a>`, 
                        'booking', 
                        'profile.html'
                    );
                }
            } else {
                alert('Booking Successful!');
                // Send HANDOVER_PROMPT message if owner disabled it
                console.log("PAYMENT DEBUG: Sending Handover Prompt to Renter...");
                await fetch(`${baseUrl}/messages/sendDirect`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipientId: user.id,
                        senderId: 1, // System admin
                        senderName: "TripGo System",
                        senderEmail: "support@tripgo.com",
                        carName: carName,
                        origin: origin,
                        destination: destinationInput ? destinationInput.value : dest,
                        startDate: start,
                        endDate: end,
                        type: 'HANDOVER_PROMPT',
                        bookingId: savedBooking.id
                    })
                });

                if (typeof addNotification === 'function') {
                    addNotification(
                        `Trip Confirmed: ${carName}. Your booking is successful.`, 
                        'booking', 
                        'profile.html'
                    );
                }
            }

            // 5. Finalize Handover if applicable
            const handoverId = urlParams.get('handoverId') || booking.handoverId;
            if (handoverId) {
                console.log("PAYMENT DEBUG: Finalizing Handover for ID:", handoverId);
                let notes = {};
                try {
                    // Fetch existing handover to get notes if possible, but for simplicity we update
                    notes = { status: 'APPROVED', acceptedByName: user.fullName };
                } catch(e) {}

                await fetch(`${baseUrl}/handovers/${handoverId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        notes: JSON.stringify(notes),
                        takerId: user.id,
                        takerName: user.fullName,
                        takerEmail: user.email
                    })
                });
                console.log("PAYMENT DEBUG: Handover finalized.");
            }
            
            window.location.href = 'profile.html';

        } catch (err) {
            console.error("Booking error:", err);
            alert("Something went wrong. Please try again.");
            payBtn.disabled = false;
            payBtn.innerText = `Pay ₹${currentTotal}`;
        }
    });
});
