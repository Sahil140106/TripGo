let hMap;
let hMarker;
let hSelectedCoords = null;

// Static Fallback Data
const staticCars = [
    { id: 's1', name: "BMW M3 Competition", type: "Luxury", pricePerDay: 5000, imageUrl: "https://hips.hearstapps.com/hmg-prod/images/2025-bmw-m3-111-66562de0157ab.jpg?crop=0.827xw:0.622xh;0.163xw,0.254xh&resize=1200:*", fuelType: "Petrol", location: "Mumbai", status: "AVAILABLE" },
    { id: 's2', name: "Audi A6", type: "Sedan", pricePerDay: 3500, imageUrl: "https://imgcdn.oto.com.sg/large/gallery/exterior/16/164/audi-a6-avant-front-angle-low-view-237284.jpg?tr=w-510,h-340", fuelType: "Diesel", location: "Delhi", status: "AVAILABLE" },
    { id: 's3', name: "Mahindra Thar", type: "SUV", pricePerDay: 2500, imageUrl: "https://spn-sta.spinny.com/blog/20230829170739/Spinny-Assured-Mahindra-Thar.webp", fuelType: "Diesel", location: "Mumbai", status: "AVAILABLE" },
    { id: 's4', name: "Mercedes AMG", type: "Luxury", pricePerDay: 6000, imageUrl: "https://img-ik.cars.co.za/news-site-za/images/2021/02/mercedes-benz-c63-amg-3.jpg?tr=h-347,w-617,q-80", fuelType: "Petrol", location: "Bangalore", status: "AVAILABLE" }
];

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

function initHandoverMap() {
    if (hMap) return;
    hMap = L.map('handoverMap').setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(hMap);

    hMap.on('click', function (e) {
        const lat = e.latlng.lat.toFixed(4);
        const lng = e.latlng.lng.toFixed(4);
        if (hMarker) {
            hMarker.setLatLng(e.latlng);
        } else {
            hMarker = L.marker(e.latlng).addTo(hMap);
        }

        // Fetch location name (Reverse Geocoding)
        hSelectedCoords = `${lat}, ${lng}`; // Fallback

        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
            .then(response => response.json())
            .then(data => {
                const name = data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.state || "Selected Location";
                hSelectedCoords = name;
                hMarker.bindPopup(name).openPopup();
            })
            .catch(() => {
                hSelectedCoords = `${lat}, ${lng}`;
            });
    });
}

function toggleHandoverMap() {
    const wrapper = document.getElementById('handoverMapWrapper');
    if (wrapper.style.display === 'none') {
        wrapper.style.display = 'block';
        setTimeout(() => {
            initHandoverMap();
            hMap.invalidateSize();
        }, 100);
    } else {
        wrapper.style.display = 'none';
    }
}

function confirmHandoverLocation() {
    if (hSelectedCoords) {
        document.getElementById('handoverLocation').value = hSelectedCoords;
        document.getElementById('handoverMapWrapper').style.display = 'none';
    } else {
        alert("Please click on the map first.");
    }
}

function checkHandoverParams() {
    console.log("Checking handover parameters...");
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'handover') {
        const carId = urlParams.get('carId');
        let car = urlParams.get('car') || 'Car Model';
        const bookingId = urlParams.get('bookingId') || 'TG-1024';
        let ownerName = (urlParams.get('ownerName') && urlParams.get('ownerName') !== 'null' && urlParams.get('ownerName') !== 'undefined') ? urlParams.get('ownerName') : 'N/A';
        let ownerEmail = (urlParams.get('ownerEmail') && urlParams.get('ownerEmail') !== 'null' && urlParams.get('ownerEmail') !== 'undefined') ? urlParams.get('ownerEmail') : 'N/A';
        let carLocation = urlParams.get('carLocation') || 'N/A';
        let carImage = urlParams.get('carImage') || '';
        let carHub = urlParams.get('carHub') || '';

        // Robust lookup from allCars if possible
        if (allCars.length > 0) {
            const carObj = carId ? allCars.find(c => String(c.id) === String(carId)) : allCars.find(c => c.name === car);
            if (carObj) {
                if (ownerName === 'N/A' || ownerName === 'Unknown Owner') ownerName = carObj.ownerName || 'N/A';
                if (ownerEmail === 'N/A' || ownerEmail === 'Unknown Owner') ownerEmail = carObj.ownerEmail || 'N/A';
                if (carLocation === 'N/A') carLocation = carObj.location || 'N/A';
                if (!carImage) carImage = carObj.imageUrl || '';
                if (!carHub) carHub = carObj.nearbyHub || '';
                if (car === 'Car Model' && carObj.name) car = carObj.name;
            }
        }

        const finalDestHub = carHub || carLocation || 'N/A';
        document.getElementById('h-fixed-destination-display').textContent = finalDestHub;
        document.getElementById('handoverDestination').value = finalDestHub;
        if (document.getElementById('h-destination-hub-display')) {
            document.getElementById('h-destination-hub-display').value = finalDestHub;
        }

        const pricePerDay = parseFloat(urlParams.get('pricePerDay')) || 0;
        const originalStart = urlParams.get('startDate');
        const originalEnd = urlParams.get('endDate');

        const prefill = urlParams.get('prefill');
        const dest = urlParams.get('dest');

        // Switch to handover section
        const tripHandoverLink = document.getElementById('tripHandoverLink');
        if (tripHandoverLink) tripHandoverLink.click();

        // Open and pre-fill form
        document.getElementById('formCarModel').value = car || '';
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const renterName = (currentUser && currentUser.fullName) ? currentUser.fullName : 'User';
        const renterEmail = (currentUser && currentUser.email) ? currentUser.email : 'N/A';

        document.getElementById('formRenterName').value = renterName;
        document.getElementById('formRenterEmail').value = renterEmail;
        document.getElementById('h-renter-name-text').textContent = renterName;
        document.getElementById('h-display-car').textContent = car || 'Car Model';
        document.getElementById('h-display-id').textContent = `#${bookingId}`;
        document.getElementById('formBookingId').value = (bookingId && bookingId.startsWith('TG-')) ? bookingId.replace('TG-', '') : bookingId;

        document.getElementById('h-display-owner').textContent = `Owner: ${ownerName}`;
        document.getElementById('h-display-owner-email').textContent = `Email: ${ownerEmail}`;
        document.getElementById('h-owner-name-display').textContent = `Owner Name: ${ownerName}`;
        document.getElementById('h-owner-email-display').textContent = `Owner Email: ${ownerEmail}`;
        document.getElementById('formOwnerName').value = ownerName;
        document.getElementById('formOwnerEmail').value = ownerEmail;

        // Set recipient email if available
        if (currentUser && currentUser.email) {
            document.getElementById('h-recipient-email').value = currentUser.email;
            document.getElementById('formRenterEmail').value = currentUser.email;
        }

        // Always set carImage if available
        document.getElementById('formCarImage').value = carImage;
        const imgEl = document.getElementById('h-modal-car-img');
        const svgEl = document.getElementById('h-modal-car-svg');
        if (carImage) {
            imgEl.src = carImage;
            imgEl.style.display = 'block';
            svgEl.style.display = 'none';
        } else {
            imgEl.style.display = 'none';
            svgEl.style.display = 'block';
        }

        if (prefill) {
            document.getElementById('handoverLocation').value = dest || '';
        }

        const locationSelect = document.getElementById('h-handover-location-select');
        locationSelect.addEventListener('change', () => {
            document.getElementById('handoverLocation').value = locationSelect.value;
        });

        const startInput = document.getElementById('h-handover-date');
        const returnInput = document.getElementById('h-handover-return-date');

        // Set min/max based on original booking
        if (originalStart) startInput.min = originalStart;
        if (originalEnd) {
            startInput.max = originalEnd;
            returnInput.value = originalEnd; // Fixed to original end
            returnInput.readOnly = true;    // Lock it
            returnInput.style.background = '#f1f5f9'; // Visual hint
            returnInput.style.cursor = 'not-allowed';
            returnInput.title = "Handover must end on the original trip's return date.";
        }

        function calculateHandoverCost() {
            // 75% of the car's original listing price (daily rate)
            const discountedDailyRate = pricePerDay * 0.75;

            // Update Submit Button Text to show the 75% Daily Rate (Rate is independent of dates)
            const submitBtn = document.getElementById('h-submit-btn');
            if (submitBtn) {
                submitBtn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    List for Handover @ ₹${Math.round(discountedDailyRate).toLocaleString('en-IN')} / Day
                `;
            }

            // Update hidden field for submission with the discounted daily rate
            document.getElementById('handoverCostSharing').value = discountedDailyRate;

            const start = new Date(startInput.value);
            const end = new Date(returnInput.value);

            if (isNaN(start) || isNaN(end) || end <= start) {
                return;
            }
        }

        // Initialize button price immediately
        calculateHandoverCost();

        startInput.addEventListener('change', () => {
            returnInput.min = startInput.value;
            calculateHandoverCost();
        });
        returnInput.addEventListener('change', calculateHandoverCost);

        if (urlParams.get('prefill') === 'true') {
            openHandoverModal();
        }
    }
}

let allCars = []; 

window.addEventListener('error', function(e) {
    console.error("Global Error (Caught):", e.message);
});

async function fetchCars() {
    console.log("Fetching cars from:", CAR_API_URL);
    try {
        const response = await fetch(`${CAR_API_URL}`);
        if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
                allCars = data;
                console.log(`Successfully loaded ${allCars.length} cars from API.`);
            } else {
                console.warn("API returned empty car list. Using fallback.");
                allCars = staticCars;
            }
            
            // Diagnostic Overlay
            const diag = document.createElement('div');
            diag.id = 'diag-overlay';
            diag.style = "position:fixed; bottom:70px; left:10px; background:rgba(0,0,0,0.8); color:chartreuse; padding:10px; z-index:10000; font-size:12px; border-radius:5px;";
            diag.innerHTML = `Loaded: ${allCars.length} cars.<br>First 5: ${allCars.slice(0,5).map(c=>c.name).join(', ')}`;
            document.body.appendChild(diag);

            renderCars();
        } else {
            console.error("Fetch cars failed with status:", response.status);
            allCars = staticCars;
            renderCars();
        }
    } catch (err) {
        console.error("Fetch cars NETWORK error. Using fallback:", err);
        allCars = staticCars;
        renderCars();
        // filterCars();
    }
}

function renderCars() {
    const carGrid = document.getElementById('carGrid');
    if (!carGrid) {
        console.error("Element #carGrid not found!");
        return;
    }

    try {
        if (allCars.length === 0) {
            carGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #64748b;">
                    <h3>No cars available at the moment.</h3>
                </div>
            `;
            return;
        }

        const handoverCarModels = (window.allHandovers || []).map(h => h.carModel);

        carGrid.innerHTML = allCars
            .map(car => {
                const price = car.pricePerDay || 0;
                const name = car.name || "Unknown Car";
                const location = car.location || "N/A";
                const fuelType = car.fuelType || "N/A";
                const carType = car.type || "SUV";
                const img = car.imageUrl || '';
                
                let status = (car.status || 'AVAILABLE').toUpperCase();
                if (handoverCarModels.includes(name)) status = 'UNAVAILABLE';

                return `
                    <div class="car-card" data-id="${car.id}" data-price="${price}" data-type="${carType}" data-location="${location}" 
                         data-name="${name}">
                        <div class="car-image">
                            <span class="badge ${status === 'AVAILABLE' ? 'available' : 'booked'}">${status}</span>
                            ${img ? `<img src="${img}" alt="${name}">` : '<div style="height:100%; display:flex; align-items:center; justify-content:center; background:#eee;">No Image</div>'}
                        </div>
                        <div class="car-info">
                            <h3>${name}</h3>
                            <p class="car-meta">${location} | ${fuelType}</p>
                            <div class="price-rating">
                                <span class="price">₹${price}<span>/day</span></span>
                            <div style="display: flex; gap: 10px;">
                                <button class="view-btn" style="flex: 1; background: #0ea5e9;" onclick="openModal(this.closest('.car-card'))">Details</button>
                                <button class="view-btn" style="flex: 1; ${status !== 'AVAILABLE' ? 'background: #94a3b8; cursor: not-allowed;' : 'background: var(--primary-gradient);'}" 
                                        ${status !== 'AVAILABLE' ? 'disabled' : ''}
                                        onclick="handleBooking('${name}')">
                                    ${status !== 'AVAILABLE' ? (status === 'BOOKED' ? 'Booked' : status) : 'Book Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            console.log("Render completed successfully.");
    } catch (err) {
        console.error("Render error:", err);
        carGrid.innerHTML = `<div style="color:red; text-align:center; padding:20px;">Render Error: ${err.message}</div>`;
    }
}

function openModal(card) {
    const carModal = document.getElementById('carModal');
    const modalImg = document.getElementById('modalImg');
    const modalTitle = document.getElementById('modalTitle');
    const modalMeta = document.getElementById('modalMeta');
    const modalPrice = document.getElementById('modalPrice');

    const title = card.querySelector('h3').textContent;
    const img = card.querySelector('img').src;
    const price = card.getAttribute('data-price');
    const location = card.getAttribute('data-location');
    const fuel = card.getAttribute('data-fuel');
    const owner = card.getAttribute('data-owner') || 'Unknown Owner';
    const hub = card.getAttribute('data-hub') || 'Mumbai Central';

    modalTitle.textContent = title;
    modalImg.src = img;
    modalPrice.textContent = `₹${price}`;

    const destHubInput = document.getElementById('modalDestinationHub');
    if (destHubInput) destHubInput.value = hub;

    modalMeta.innerHTML = `
        <span style="display: flex; align-items: center; gap: 4px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            ${location}
        </span>
        <span style="display: flex; align-items: center; gap: 4px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 22L17 22"></path><path d="M4 9L15 9"></path><path d="M14 22L14 11"></path><path d="M14 7L14 4"></path><path d="M14 4L5 4"></path><path d="M5 4L5 22"></path><path d="M15 9L21 9"></path><path d="M21 9L21 22"></path></svg>
            ${fuel}
        </span>
    `;

    if (document.getElementById('modalFuel')) document.getElementById('modalFuel').textContent = fuel;
    if (document.getElementById('modalSeats')) document.getElementById('modalSeats').textContent = card.getAttribute('data-seats');
    if (document.getElementById('modalTrans')) document.getElementById('modalTrans').textContent = card.getAttribute('data-trans');
    if (document.getElementById('modalLuggage')) document.getElementById('modalLuggage').textContent = card.getAttribute('data-luggage');

    const ownerNameEl = document.getElementById('modalOwnerName');
    if (ownerNameEl) ownerNameEl.textContent = `Owner: ${owner}`;

    const modalBookBtn = document.getElementById('modalBookBtn');
    if (modalBookBtn) modalBookBtn.onclick = () => handleBooking(title);

    carModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('carModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function handleBooking(carName, handoverData) {
    const modalTitle = document.getElementById('modalTitle');
    const modalPrice = document.getElementById('modalPrice');
    const modalImg = document.getElementById('modalImg');

    if (!carName || typeof carName !== 'string') {
        carName = modalTitle.textContent.trim();
    }

    const cards = [...document.querySelectorAll('.car-card')];
    const card = cards.find(c => c.querySelector('h3').textContent.trim() === carName);

    if (!card && !document.getElementById('carModal').classList.contains('active')) {
        alert("Car selection error.");
        return;
    }

    const priceRaw = card ? card.getAttribute('data-price') : modalPrice.textContent.replace('₹', '').trim();
    const price = parseInt(priceRaw.toString().replace(/,/g, '')) || 0;
    const img = card ? card.querySelector('img').src : modalImg.src;
    const id = card ? (card.getAttribute('data-id') || '123') : '123';
    const handoverValue = card ? (card.getAttribute('data-handover') === 'true') : true;

    // Get car specs from card attributes
    const carType = card ? card.getAttribute('data-type') : 'SUV';
    const fuel = card ? card.getAttribute('data-fuel') : 'Diesel';
    const trans = card ? card.getAttribute('data-trans') : 'Manual';
    const seats = card ? card.getAttribute('data-seats') : '5';
    const luggage = card ? card.getAttribute('data-luggage') : '2';
    const deposit = card ? card.getAttribute('data-deposit') : '3000';

    const bookingData = {
        id, name: carName, price, img,
        origin: handoverData ? handoverData.pickupLocation : (card ? card.getAttribute('data-location') : 'Mumbai'),
        dest: handoverData ? handoverData.destination : document.getElementById('modalDestinationHub').value,
        isHandoverBooking: !!handoverData,
        handoverId: handoverData ? handoverData.id : null,
        pickup: handoverData ? handoverData.startDate : new Date().toISOString().split('T')[0],
        returnDate: handoverData ? handoverData.returnDate : new Date(Date.now() + 15*86400000).toISOString().split('T')[0],
        handover: handoverValue,
        type: carType,
        fuel: fuel,
        trans: trans,
        seats: seats,
        luggage: luggage,
        deposit: deposit
    };

    sessionStorage.setItem('currentBooking', JSON.stringify(bookingData));
    window.location.href = `payment.html?id=${id}&name=${encodeURIComponent(carName)}&price=${price}&handover=${handoverValue}`;
}

function filterCars() {
    const maxPriceFilter = document.getElementById('maxPriceFilter');
    const maxPriceDisplay = document.getElementById('maxPriceDisplay');
    const rangeFill = document.getElementById('rangeFill');
    const typeFilter = document.getElementById('typeFilter');
    const locationFilter = document.getElementById('locationFilter');
    const carSearch = document.getElementById('carSearch');

    const valMax = parseInt(maxPriceFilter.value);
    maxPriceDisplay.textContent = `₹${valMax}`;
    
    const percentage = ((valMax - maxPriceFilter.min) / (maxPriceFilter.max - maxPriceFilter.min)) * 100;
    rangeFill.style.width = percentage + "%";

    const selectedType = typeFilter.value.toLowerCase();
    const selectedLocation = locationFilter.value.toLowerCase();
    const searchQuery = carSearch.value.toLowerCase();

    const carCards = Array.from(document.getElementById('carGrid').getElementsByClassName('car-card'));

    carCards.forEach(card => {
        const priceAttr = card.getAttribute('data-price') || "0";
        const price = parseInt(priceAttr.toString().replace(/,/g, ''));
        const type = (card.getAttribute('data-type') || '').toLowerCase();
        const location = (card.getAttribute('data-location') || '').toLowerCase();
        const name = card.querySelector('h3').textContent.toLowerCase();

        const matches = price <= valMax && 
                      (selectedType === "" || type === selectedType) &&
                      (selectedLocation === "" || location === selectedLocation) &&
                      name.includes(searchQuery);

        card.style.display = matches ? "block" : "none";
    });
}

function setupHandoverFilters() {
    const hSearch = document.getElementById('handoverSearch');
    const hLoc = document.getElementById('handoverLocationFilter');
    const hType = document.getElementById('handoverTypeFilter');
    const hMaxPrice = document.getElementById('handoverMaxPriceFilter');

    if (hSearch) hSearch.addEventListener('input', filterHandovers);
    if (hLoc) hLoc.addEventListener('change', filterHandovers);
    if (hType) hType.addEventListener('change', filterHandovers);
    if (hMaxPrice) hMaxPrice.addEventListener('input', filterHandovers);
    
    filterHandovers();
}

function filterHandovers() {
    const hMaxPriceFilter = document.getElementById('handoverMaxPriceFilter');
    const hMaxPriceDisplay = document.getElementById('handoverMaxPriceDisplay');
    const hRangeFill = document.getElementById('handoverRangeFill');
    
    if (!hMaxPriceFilter) return;

    const valMax = parseInt(hMaxPriceFilter.value);
    if (hMaxPriceDisplay) hMaxPriceDisplay.textContent = `₹${valMax}`;
    if (hRangeFill) hRangeFill.style.width = ((valMax - hMaxPriceFilter.min) / (hMaxPriceFilter.max - hMaxPriceFilter.min) * 100) + "%";

    const selectedType = document.getElementById('handoverTypeFilter').value.toLowerCase();
    const selectedLocation = document.getElementById('handoverLocationFilter').value.toLowerCase();
    const searchQuery = document.getElementById('handoverSearch').value.toLowerCase();

    const handoverCards = Array.from(document.getElementById('handoverGrid').getElementsByClassName('handover-card'));

    handoverCards.forEach(card => {
        const priceAttr = card.getAttribute('data-price') || "0";
        const price = parseInt(priceAttr.toString().replace(/,/g, ''));
        const type = (card.getAttribute('data-type') || '').toLowerCase();
        const location = (card.getAttribute('data-location') || '').toLowerCase();
        const name = (card.getAttribute('data-name') || '').toLowerCase();

        const matches = price <= valMax && 
                      (selectedType === "" || type === selectedType) &&
                      (selectedLocation === "" || location === selectedLocation) &&
                      name.includes(searchQuery);

        card.style.display = matches ? "block" : "none";
    });
}

let allHandovers = [];
async function fetchHandovers() {
    try {
        const response = await fetch(`${HANDOVER_API_URL}`);
        if (response.ok) {
            allHandovers = await response.json();
            window.allHandovers = allHandovers;
            renderHandovers(allHandovers);
            renderCars(); 
            filterHandovers(); // Apply filters immediately after rendering
        }
    } catch (err) {
        console.error('Fetch handovers error:', err);
    }
}

function renderHandovers(handovers) {
    const container = document.getElementById('handoverGrid');
    if (!container) return;

    if (handovers.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;"><h3>No Active Handovers</h3></div>`;
        return;
    }

    container.innerHTML = handovers.map(h => {
        const isBooked = h.takerId != null;
        return `
            <div class="car-card handover-card" data-price="${h.costSharing}" data-name="${h.carModel}">
                <div class="car-image">
                    <span class="badge ${isBooked ? 'booked' : 'available'}">${isBooked ? 'BOOKED' : 'HANDOVER'}</span>
                    <img src="${h.carImage || 'creta.jpg'}" alt="${h.carModel}">
                </div>
                <div class="car-info">
                    <h3>${h.carModel}</h3>
                    <p class="car-meta">${h.pickupLocation}</p>
                    <div class="price-rating"><span class="price">₹${h.costSharing}<span>/day</span></span></div>
                    <div style="display: flex; gap: 10px;">
                        <button class="view-btn" style="flex: 1; background: #0ea5e9;" onclick="openHandoverDetailsModal('${h.id}')">Details</button>
                        <button class="view-btn" style="flex: 1; ${isBooked ? 'background: #94a3b8; cursor: not-allowed;' : 'background: var(--primary-gradient);'}" 
                                ${isBooked ? 'disabled' : ''}
                                onclick="handleBooking('${h.carModel}', { id: '${h.id}', pickupLocation: '${h.pickupLocation}', price: ${h.costSharing}, startDate: '${h.pickupDate}', returnDate: '${h.returnDate}' })">
                            ${isBooked ? 'Car Booked' : 'Book Now'}
                        </button>
                    </div>
                </div>
            </div>`;
    }).join('');
}

function openHandoverModal() {
    document.getElementById('handoverModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeHandoverModal() {
    document.getElementById('handoverModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    document.getElementById('handoverCompleteForm').reset();
}

function openHandoverDetailsModal(id) {
    const h = allHandovers.find(item => String(item.id) === String(id));
    if (!h) return;

    // Find car details from allCars using carModel to show specs (fuel, seats, etc.)
    const carDetails = allCars.find(c => c.name === h.carModel) || {};

    document.getElementById('hd-car-model').textContent = h.carModel || 'Car Model';
    const hdImage = document.getElementById('hd-image');
    if (hdImage) {
        hdImage.src = h.carImage || carDetails.imageUrl || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80';
    }

    // Populate Specs
    if (document.getElementById('hd-fuel')) document.getElementById('hd-fuel').textContent = carDetails.fuelType || 'N/A';
    if (document.getElementById('hd-seats')) document.getElementById('hd-seats').textContent = carDetails.seating || '5';
    if (document.getElementById('hd-trans')) document.getElementById('hd-trans').textContent = carDetails.transmission || 'Manual';
    if (document.getElementById('hd-luggage')) document.getElementById('hd-luggage').textContent = carDetails.luggage || '2';

    // Populate Price
    const priceEl = document.getElementById('hd-price');
    if (priceEl) priceEl.textContent = `₹${(h.costSharing || 0).toLocaleString('en-IN')}`;

    // Populate Meta (Location)
    const metaEl = document.getElementById('hd-meta');
    if (metaEl) {
        metaEl.innerHTML = `
            <span style="display: flex; align-items: center; gap: 4px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                ${h.pickupLocation || 'Station/Hub'}
            </span>
        `;
    }

    // Populate Dates (Read Only)
    const pickupDateInput = document.getElementById('hd-pickup-date-input');
    const returnDateInput = document.getElementById('hd-return-date-input');
    if (pickupDateInput) {
        pickupDateInput.value = h.pickupDate;
        pickupDateInput.readOnly = true;
    }
    if (returnDateInput) {
        returnDateInput.value = h.returnDate;
        returnDateInput.readOnly = true;
    }

    // Populate Owner & Renter Info
    if (document.getElementById('hd-owner-name')) document.getElementById('hd-owner-name').textContent = h.ownerName || 'Original Owner';
    if (document.getElementById('hd-owner-email')) document.getElementById('hd-owner-email').textContent = h.ownerEmail || 'N/A';
    if (document.getElementById('hd-renter-name')) document.getElementById('hd-renter-name').textContent = h.renterName || 'Current Renter';
    if (document.getElementById('hd-renter-email')) document.getElementById('hd-renter-email').textContent = h.renterEmail || 'N/A';

    // Populate Notes
    const notesEl = document.getElementById('hd-notes');
    const notesContainer = document.getElementById('hd-notes-container');
    if (notesEl && notesContainer) {
        let noteText = '';
        if (h.notes && h.notes !== '{}') {
            try {
                const parsed = JSON.parse(h.notes);
                noteText = parsed.comment || '';
            } catch (e) {
                noteText = h.notes;
            }
        }
        if (noteText) {
            notesEl.textContent = noteText;
            notesContainer.style.display = 'block';
        } else {
            notesContainer.style.display = 'none';
        }
    }

    // Configure Book Button
    const bookBtn = document.getElementById('hd-book-btn');
    if (bookBtn) {
        bookBtn.onclick = () => handleBooking(h.carModel, {
            id: h.id,
            pickupLocation: h.pickupLocation,
            price: h.costSharing,
            startDate: h.pickupDate,
            returnDate: h.returnDate
        });
    }

    document.getElementById('handoverDetailsModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeHandoverDetailsModal() {
    document.getElementById('handoverDetailsModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// --- View Switching (Browse vs Handover) ---
function switchBrowseView(view) {
    const browseSection = document.getElementById('browseCarSection');
    const handoverSection = document.getElementById('tripHandoverSection');
    const browseLink = document.getElementById('browseCarsLink');
    const handoverLink = document.getElementById('tripHandoverLink');
    const pageTitle = document.getElementById('pageTitle');

    if (view === 'handover') {
        browseSection.style.display = 'none';
        handoverSection.style.display = 'block';
        pageTitle.textContent = 'Trip Handover';
        if (browseLink) browseLink.classList.remove('active');
        if (handoverLink) handoverLink.classList.add('active');
        fetchHandovers();
    } else {
        browseSection.style.display = 'block';
        handoverSection.style.display = 'none';
        pageTitle.textContent = 'Browse Cars';
        if (browseLink) browseLink.classList.add('active');
        if (handoverLink) handoverLink.classList.remove('active');
        fetchCars();
    }
}

// Event Listeners Initialization
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOMContentLoaded: Starting initialization...");
    try {
        if (typeof updateAllProfileIcons === 'function') {
            try {
                updateAllProfileIcons();
            } catch (e) { console.warn("updateAllProfileIcons failed:", e); }
        }
        
        await fetchCars();
        await fetchHandovers();
        
        if (typeof setupHandoverFilters === 'function') setupHandoverFilters();
        if (typeof checkHandoverParams === 'function') checkHandoverParams();
    } catch (err) {
        console.error("Initialization Error:", err);
        const errDiv = document.createElement('div');
        errDiv.style = "position:fixed;bottom:10px;right:10px;background:red;color:white;padding:10px;z-index:10000;font-size:12px;border-radius:5px;";
        errDiv.textContent = "Initialization failed: " + err.message;
        document.body.appendChild(errDiv);
    }

    const maxPriceFilter = document.getElementById('maxPriceFilter');
    if (maxPriceFilter) maxPriceFilter.addEventListener('input', filterCars);
    
    const locationFilter = document.getElementById('locationFilter');
    if (locationFilter) locationFilter.addEventListener('change', filterCars); // Filter Logic
    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter) typeFilter.addEventListener('change', filterCars);

    const carSearch = document.getElementById('carSearch');
    if (carSearch) carSearch.addEventListener('input', filterCars);
    
    const tripHandoverLink = document.getElementById('tripHandoverLink');
    if (tripHandoverLink) {
        tripHandoverLink.addEventListener('click', (e) => {
            e.preventDefault();
            switchBrowseView('handover');
        });
    }

    const browseCarsLink = document.getElementById('browseCarsLink');
    if (browseCarsLink) {
        browseCarsLink.addEventListener('click', (e) => {
            e.preventDefault();
            switchBrowseView('browse');
        });
    }

    const closeHandoverV2 = document.getElementById('closeHandoverModalV2');
    if (closeHandoverV2) closeHandoverV2.onclick = closeHandoverModal;

    const handoverCompleteForm = document.getElementById('handoverCompleteForm');
    if (handoverCompleteForm) {
        handoverCompleteForm.onsubmit = async (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('h-submit-btn');
            const errorMsg = document.getElementById('handover-error-message');
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            if (errorMsg) errorMsg.style.display = 'none';

            const handoverLocation = document.getElementById('handoverLocation').value || document.getElementById('h-handover-location-select').value;
            const handoverDestination = document.getElementById('handoverDestination').value || document.getElementById('h-destination-hub-display').value;
            const costSharing = parseFloat(document.getElementById('handoverCostSharing').value) || 0;

            const payload = {
                bookingId: parseInt(document.getElementById('formBookingId').value) || 0,
                carModel: document.getElementById('formCarModel').value,
                renterName: document.getElementById('formRenterName').value,
                renterEmail: document.getElementById('formRenterEmail').value,
                ownerName: document.getElementById('formOwnerName').value,
                ownerEmail: document.getElementById('formOwnerEmail').value,
                pickupDate: document.getElementById('h-handover-date').value,
                returnDate: document.getElementById('h-handover-return-date').value,
                pickupLocation: handoverLocation,
                destination: handoverDestination,
                costSharing: costSharing,
                carImage: document.getElementById('formCarImage').value,
                notes: document.getElementById('h-recipient-email').value || "Handover Listing"
            };

            const apiHost = window.location.hostname || '127.0.0.1';
            try {
                const response = await fetch(`${HANDOVER_API_URL}/store`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const savedHandover = await response.json();
                    
                    // Send notification to System/Owner about new handover listing (Backend Message)
                    try {
                        const messagePayload = {
                                recipientId: (JSON.parse(localStorage.getItem('user')) || {}).id, 
                                senderId: 1,
                                senderName: "TripGo System",
                                senderEmail: "support@tripgo.com",
                                carName: payload.carModel,
                                origin: payload.pickupLocation,
                                destination: payload.destination,
                                startDate: payload.pickupDate,
                                endDate: payload.returnDate,
                                type: 'HANDOVER',
                                bookingId: payload.bookingId
                        };
                        
                        await fetch(`${MESSAGE_API_URL}/sendDirect`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(messagePayload)
                        });
                    } catch (mErr) { console.warn("Backend notification delayed:", mErr); }

                    // Send actual Email via Brevo
                    const hSubject = `TripGo: Car Listed for Handover - ${payload.carModel}`;
                    const hMsg = `Hi ${payload.renterName},\n\n` +
                                 `You have successfully listed ${payload.carModel} for Trip Handover.\n` +
                                 `Journey: ${payload.pickupLocation} to ${payload.destination}\n` +
                                 `Reward Point Sharing: ₹${Math.round(payload.costSharing)} / Day\n\n` +
                                 `You will be notified once someone accepts your listing.`;
                    
                    await sendEmail(payload.renterEmail, hSubject, hMsg);

                    alert("Success! Your trip has been listed for handover.");
                    closeHandoverModal();
                    if (typeof fetchHandovers === 'function') fetchHandovers();
                } else {
                    const err = await response.text();
                    throw new Error(err || "Failed to list handover.");
                }
            } catch (err) {
                console.error("Handover Submission Error:", err);
                if (errorMsg) {
                    let userMsg = err.message;
                    if (err.message.includes('fetch')) {
                        userMsg = "Failed to connect to server. Please ensure the Backend (Spring Boot) is running on port 8080.";
                    }
                    errorMsg.textContent = userMsg;
                    errorMsg.style.display = 'block';
                } else {
                    alert("Error: " + err.message);
                }
            }
 finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    List for Handover @ ₹${Math.round(payload.costSharing).toLocaleString('en-IN')} / Day
                `;
            }
        };
    }
});

window.onclick = function (event) {
    if (event.target.id === 'carModal') closeModal();
    if (event.target.id === 'handoverModal') closeHandoverModal();
}
