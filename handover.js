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

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const carId = urlParams.get('carId');
    const carName = urlParams.get('car');
    const bookingId = urlParams.get('bookingId');
    const ownerName = urlParams.get('ownerName') || 'N/A';
    const ownerEmail = urlParams.get('ownerEmail') || 'N/A';
    const pricePerDay = parseFloat(urlParams.get('pricePerDay')) || 2500;
    const startDate = urlParams.get('startDate');
    const endDate = urlParams.get('endDate');
    const carLocation = urlParams.get('carLocation');
    const carImage = urlParams.get('carImage') || '';
    const carHub = urlParams.get('carHub');
    const handoverId = urlParams.get('handoverId');

    if (handoverId) {
        loadHandoverForEdit(handoverId);
    }

    async function loadHandoverForEdit(id) {
        try {
            const response = await fetch(`${HANDOVER_API_URL}/${id}`);
            if (response.ok) {
                const h = await response.json();
                if (h) {
                    // Update main display car details
                    document.getElementById('display-car-name').textContent = h.carModel || 'Unknown Car';
                    document.getElementById('display-car-img').src = h.carImage || '';
                    document.getElementById('display-booking-id').textContent = `Booking ID: #${h.bookingId || 'N/A'}`;
                    document.getElementById('display-owner-info').textContent = `Owner: ${h.ownerName || 'N/A'} (${h.ownerEmail || 'N/A'})`;

                    // Pre-fill hidden fields
                    document.getElementById('formCarId').value = h.carId || '';
                    document.getElementById('formBookingId').value = h.bookingId || '';
                    document.getElementById('formCarImage').value = h.carImage || '';
                    
                    // Pre-fill fields
                    const handoverDateInput = document.getElementById('handoverDate');
                    const pickupHubSelect = document.getElementById('pickupHub');
                    const destinationHubSelect = document.getElementById('destinationHub');
                    const returnDateInput = document.getElementById('returnDate');
                    const finalCostInput = document.getElementById('finalCost');
                    const notesTextarea = document.getElementById('notes');

                    handoverDateInput.value = h.pickupDate;
                    pickupHubSelect.value = h.pickupLocation;
                    destinationHubSelect.value = h.destination;
                    returnDateInput.value = h.returnDate;
                    finalCostInput.value = h.costSharing;
                    
                    let meta = {};
                    try { meta = JSON.parse(h.notes || '{}'); } catch(e) {}
                    notesTextarea.value = meta.userNotes || '';
                    
                    // DO NOT DISABLE ALL FIELDS: User wants to edit everything EXCEPT Destination
                    const destSelect = document.getElementById('destinationHub');
                    destSelect.disabled = true;
                    destSelect.style.background = '#f1f5f9';
                    destSelect.style.cursor = 'not-allowed';
                    destSelect.title = "The car must be returned to its registered hub.";
                    
                    if (!document.getElementById('hiddenDestination')) {
                        const hiddenDest = document.createElement('input');
                        hiddenDest.type = 'hidden';
                        hiddenDest.name = 'destination';
                        hiddenDest.id = 'hiddenDestination';
                        hiddenDest.value = destSelect.value;
                        document.getElementById('handoverForm').appendChild(hiddenDest);
                    }
                    
                    // Update header and button
                    document.querySelector('h1').textContent = 'Edit Trip Handover';
                    document.querySelector('button[type="submit"]').textContent = 'Update Handover Listing';
                }
            }
        } catch (err) { console.error("Load for edit error:", err); }
    }

    // Pre-fill hidden fields and text
    document.getElementById('formCarId').value = carId;
    document.getElementById('formBookingId').value = bookingId;
    document.getElementById('formCarImage').value = carImage;
    document.getElementById('formPricePerDay').value = pricePerDay;

    document.getElementById('display-car-name').textContent = carName || 'Unknown Car';
    document.getElementById('display-booking-id').textContent = `Booking ID: #${bookingId}`;
    document.getElementById('display-owner-info').textContent = `Owner: ${ownerName} (${ownerEmail})`;
    if (carImage) {
        document.getElementById('display-car-img').src = carImage;
    }

    // Set dates
    if (startDate) {
        document.getElementById('handoverDate').value = startDate;
        document.getElementById('handoverDate').min = startDate;
        document.getElementById('handoverDate').max = endDate;
    }
    if (endDate) {
        const returnInput = document.getElementById('returnDate');
        returnInput.value = endDate;
        returnInput.min = startDate;
        returnInput.max = endDate;
        returnInput.readOnly = true; // Lock it
        returnInput.style.background = '#f1f5f9';
        returnInput.style.cursor = 'not-allowed';
        returnInput.title = "Handover must end on the original trip's return date.";
    }

    // Pre-fill destination hub if possible and LOCK it
    const hubToSet = carHub || carLocation;
    if (hubToSet) {
        const destSelect = document.getElementById('destinationHub');
        let found = false;
        for (let i = 0; i < destSelect.options.length; i++) {
            if (destSelect.options[i].value.toLowerCase().includes(hubToSet.toLowerCase()) || 
                hubToSet.toLowerCase().includes(destSelect.options[i].value.toLowerCase())) {
                destSelect.selectedIndex = i;
                found = true;
                break;
            }
        }
        
        // Lock destination hub as it must go back to its home hub
        destSelect.disabled = true; 
        destSelect.style.background = '#f1f5f9';
        destSelect.style.cursor = 'not-allowed';
        destSelect.title = "The car must be returned to its registered hub.";
        
        // Add a hidden input to ensure the value is sent with the form
        const hiddenDest = document.createElement('input');
        hiddenDest.type = 'hidden';
        hiddenDest.name = 'destination';
        hiddenDest.id = 'hiddenDestination';
        hiddenDest.value = destSelect.value;
        document.getElementById('handoverForm').appendChild(hiddenDest);
    }

    // Cost Sharing Logic (Simplified)
    const finalCost = document.getElementById('finalCost');

    // Default to 75% of original price for NEW listings
    if (!handoverId) {
        const defaultCost = Math.round(pricePerDay * 0.75);
        finalCost.value = defaultCost;
    }

    // Form Submission
    const handoverForm = document.getElementById('handoverForm');
    handoverForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Listing Car...';

    const formData = {
        carModel: document.getElementById('display-car-name').textContent,
        renterName: user.fullName || 'User',
        renterEmail: user.email,
        ownerName: document.getElementById('display-owner-info').textContent.split('(')[0].replace('Owner: ', '').trim(),
        ownerEmail: document.getElementById('display-owner-info').textContent.includes('(') ? document.getElementById('display-owner-info').textContent.split('(')[1].replace(')', '').trim() : '',
        pickupDate: document.getElementById('handoverDate').value,
        returnDate: document.getElementById('returnDate').value,
        pickupLocation: document.getElementById('pickupHub').value,
        destination: document.getElementById('hiddenDestination') ? document.getElementById('hiddenDestination').value : document.getElementById('destinationHub').value,
        carImage: document.getElementById('display-car-img').src,
        costSharing: parseFloat(finalCost.value),
        notes: JSON.stringify({
            userNotes: document.getElementById('notes').value,
            status: handoverId ? 'UPDATED' : 'LISTED',
            initiatedByEmail: user.email
        })
    };

        if (new Date(formData.pickupDate) > new Date(formData.returnDate)) {
            alert('Error: Return date cannot be before pickup date.');
            submitBtn.disabled = false;
            submitBtn.textContent = handoverId ? 'Update Handover Listing' : 'List for Handover Now';
            return;
        }

        try {
            const apiHost = window.location.hostname || '127.0.0.1';
            const url = handoverId ? `${HANDOVER_API_URL}/${handoverId}` : `${HANDOVER_API_URL}/store`;
            const method = handoverId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                // Notify Admin (Only on new listings for now, or both?)
                if (!handoverId) {
                    await fetch(`${MESSAGE_API_URL}/sendDirect`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            recipientId: 1, // Admin
                            senderId: user.id,
                            senderName: user.fullName,
                            senderEmail: user.email,
                            carName: formData.carModel,
                            origin: formData.pickupLocation,
                            destination: formData.destination,
                            startDate: formData.pickupDate,
                            endDate: formData.returnDate,
                            type: 'HANDOVER_INITIATED'
                        })
                    });
                }
                
                // Send actual Email via Brevo
                const hSubject = handoverId ? `TripGo: Handover Listing Updated - ${formData.carModel}` : `TripGo: Car Listed for Handover - ${formData.carModel}`;
                const hMsg = `Hi ${formData.renterName},\n\n` +
                             `You have successfully ${handoverId ? 'updated' : 'listed'} ${formData.carModel} for Trip Handover.\n` +
                             `Journey: ${formData.pickupLocation} to ${formData.destination}\n` +
                             `Reward Point Sharing: ₹${Math.round(formData.costSharing)} / Day\n\n` +
                             `You will be notified once someone accepts your listing.`;
                
                await sendEmail(formData.renterEmail, hSubject, hMsg);

                alert(handoverId ? 'Success! Your handover listing has been updated.' : 'Car Listed for Handover Successfully!');
                window.location.href = 'browsecar.html?mode=handover';
            } else {
                const error = await response.text();
                alert('Failed to list handover: ' + error);
                submitBtn.disabled = false;
                submitBtn.textContent = 'List for Handover Now';
            }
        } catch (err) {
            console.error('Handover error:', err);
            alert('Server error. Please try again later.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'List for Handover Now';
        }
    });
});
