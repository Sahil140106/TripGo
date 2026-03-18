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
            const response = await fetch(`${CAR_API_URL}/all`);
            if (response.ok) {
                const handovers = await response.json();
                const h = handovers.find(item => item.id == id);
                if (h) {
                    document.getElementById('display-car-name').textContent = h.carModel;
                    document.getElementById('handoverDate').value = h.pickupDate;
                    document.getElementById('returnDate').value = h.returnDate;
                    document.getElementById('pickupHub').value = h.pickupLocation;
                    document.getElementById('destinationHub').value = h.destination;
                    document.getElementById('costSlider').value = h.costSharing;
                    document.getElementById('display-car-img').src = h.carImage;
                    
                    let meta = {};
                    try { meta = JSON.parse(h.notes || '{}'); } catch(e) {}
                    document.getElementById('notes').value = meta.userNotes || '';
                    
                    updateCostDisplay(h.costSharing);
                    
                    // Update header
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

    // Pre-fill destination hub if possible
    const hubToSet = carHub || carLocation;
    if (hubToSet) {
        const destSelect = document.getElementById('destinationHub');
        for (let i = 0; i < destSelect.options.length; i++) {
            if (destSelect.options[i].value.includes(hubToSet) || hubToSet.includes(destSelect.options[i].value)) {
                destSelect.selectedIndex = i;
                break;
            }
        }
    }

    // Slider Logic
    const costSlider = document.getElementById('costSlider');
    const costValueDisplay = document.getElementById('costValueDisplay');
    const finalCost = document.getElementById('finalCost');

    // Default to 75% of original price
    const defaultCost = Math.round(pricePerDay * 0.75);
    costSlider.value = defaultCost;
    costSlider.max = pricePerDay; // Can't charge more than original
    costSlider.min = Math.round(pricePerDay * 0.2); // At least 20%

    updateCostDisplay(defaultCost);

    costSlider.addEventListener('input', (e) => {
        updateCostDisplay(e.target.value);
    });

    function updateCostDisplay(value) {
        costValueDisplay.textContent = parseInt(value).toLocaleString();
        finalCost.value = value;
        const percentage = Math.round((value / pricePerDay) * 100);
        document.querySelector('.cost-display span:last-child').textContent = `~${percentage}% of original rate`;
    }

    // Form Submission
    const handoverForm = document.getElementById('handoverForm');
    handoverForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Listing Car...';

        const formData = {
            carModel: carName,
            renterName: user.fullName || 'User',
            renterEmail: user.email,
            ownerName: ownerName,
            ownerEmail: ownerEmail,
            pickupDate: document.getElementById('handoverDate').value,
            returnDate: document.getElementById('returnDate').value,
            pickupLocation: document.getElementById('pickupHub').value,
            destination: document.getElementById('destinationHub').value,
            costSharing: parseFloat(finalCost.value),
            carImage: carImage,
            notes: JSON.stringify({
                userNotes: document.getElementById('notes').value,
                status: 'LISTED',
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
            const url = handoverId ? `http://${apiHost}:8080/api/handovers/${handoverId}` : `http://${apiHost}:8080/api/handovers/store`;
            const method = handoverId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                // Notify Admin (Only on new listings for now, or both?)
                if (!handoverId) {
                    await fetch(`http://${apiHost}:8080/api/messages/sendDirect`, {
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
