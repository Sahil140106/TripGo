const apiHost = window.location.hostname || '127.0.0.1';
const user = JSON.parse(localStorage.getItem('user'));
let myVehicles = [];

const vehiclesGrid = document.getElementById('vehiclesGrid');
const rentalHistorySection = document.getElementById('rentalHistorySection');
const rentalHistoryList = document.getElementById('rentalHistoryList');

async function fetchMyVehicles() {
    if (!user) {
        alert("Please login to see your vehicles!");
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${CAR_API_URL}/user/${user.id}`);
        if (response.ok) {
            myVehicles = await response.json();
            renderVehicles();
        } else {
            console.error('Failed to fetch vehicles');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function openVehicleModal(vehicle) {
    document.getElementById('modalVehicleImage').src = vehicle.imageUrl || "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=2000";
    document.getElementById('modalVehicleName').textContent = vehicle.name;
    document.getElementById('modalVehicleType').textContent = vehicle.type;
    document.getElementById('modalVehicleFuel').textContent = vehicle.fuelType;
    document.getElementById('modalVehicleRate').textContent = `₹${vehicle.pricePerDay.toLocaleString('en-IN')}`;
    
    const statusElement = document.getElementById('modalVehicleStatus');
    statusElement.textContent = vehicle.status;
    statusElement.className = `detail-value vehicle-status-badge ${vehicle.status.toLowerCase()}`;
    
    // Reset rental history
    rentalHistorySection.style.display = 'none';
    rentalHistoryList.innerHTML = '';

    // Handle current renter display
    const renterInfoRow = document.getElementById('currentRenterRow');
    if (renterInfoRow) renterInfoRow.remove();

    if (vehicle.status && vehicle.status.toUpperCase() === 'BOOKED') {
        const detailCard = document.querySelector('.vehicle-detail-card');
        const row = document.createElement('div');
        row.id = 'currentRenterRow';
        row.className = 'detail-row';
        row.style.borderTop = '1px dashed #e2e8f0';
        row.style.paddingTop = '12px';
        row.style.marginTop = '12px';
        row.innerHTML = `
            <span class="detail-label">Current Renter:</span>
            <span class="detail-value" style="color: #2563eb; cursor: pointer; text-decoration: underline;" id="currentRenterName">Loading...</span>
        `;
        detailCard.appendChild(row);

        // Fetch current renter from history (assuming most recent is current)
        fetch(`http://${apiHost}:8080/api/cars/${vehicle.id}/history`)
            .then(res => res.json())
            .then(history => {
                const nameEl = document.getElementById('currentRenterName');
                if (history && history.length > 0) {
                    const current = history[0]; // Assuming newest is first
                    if (nameEl) {
                        const displayId = current.renterDisplayId || (current.renterId ? "TGO-" + current.renterId : "Unknown");
                        nameEl.textContent = displayId;
                        nameEl.onclick = () => openUserProfile(current.renterId, current);
                    }
                } else if (nameEl) {
                    nameEl.textContent = "Details unavailable";
                    nameEl.style.color = "#94a3b8";
                    nameEl.style.textDecoration = "none";
                }
            })
            .catch(err => {
                const nameEl = document.getElementById('currentRenterName');
                if (nameEl) nameEl.textContent = "Error loading renter";
                console.error(err);
            });
    }

    // Store current vehicle ID for modal actions
    document.getElementById('vehicleModalOverlay').dataset.carId = vehicle.id;
    
    document.getElementById('vehicleModalOverlay').classList.add('active');
}

function closeVehicleModal() {
    document.getElementById('vehicleModalOverlay').classList.remove('active');
}

async function viewRentalHistory() {
    const carId = document.getElementById('vehicleModalOverlay').dataset.carId;
    if (!carId) return;

    try {
        const response = await fetch(`http://${apiHost}:8080/api/cars/${carId}/history`);
        if (response.ok) {
            const history = await response.json();
            renderHistory(history);
        } else {
            alert("Failed to fetch rental history");
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderHistory(history) {
    rentalHistorySection.style.display = 'block';
    if (history.length === 0) {
        rentalHistoryList.innerHTML = '<p style="color: var(--text-sub); font-size: 14px;">No rental history found for this vehicle.</p>';
        return;
    }

    rentalHistoryList.innerHTML = history.map(item => {
        const displayId = item.renterDisplayId || (item.renterId ? 'TGO-' + item.renterId : 'Unknown');
        return `
            <div class="history-item" style="cursor: pointer;" onclick="openUserProfile(${item.renterId || 'null'}, ${JSON.stringify(item).replace(/"/g, '&quot;')})">
                <div>
                    <div class="history-renter" style="color: #2563eb; text-decoration: underline;">${displayId}</div>
                    <div class="history-dates">${item.startDate} to ${item.endDate}</div>
                </div>
                <div class="history-amount">₹${item.totalAmount.toLocaleString('en-IN')}</div>
            </div>
        `;
    }).join('');
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
        const response = await fetch(`http://${apiHost}:8080/api/auth/users/${userId}`);
        
        if (response.ok) {
            const userData = await response.json();
            
            document.getElementById('userModalName').textContent = userData.fullName;
            document.getElementById('userModalEmail').textContent = userData.email;
            
            const initials = userData.fullName.charAt(0).toUpperCase();
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

function openAddVehicleModal() {
    document.getElementById('modalTitle').textContent = "List Your Car";
    document.getElementById('submitBtn').textContent = "List My Car Now";
    document.getElementById('editIndex').value = "-1";
    document.getElementById('addVehicleModalOverlay').classList.add('active');
}

function closeAddVehicleModal() {
    document.getElementById('addVehicleModalOverlay').classList.remove('active');
    document.getElementById('carListingForm').reset();
    document.getElementById('editIndex').value = "-1";
}

function editVehicle(id) {
    const vehicle = myVehicles.find(v => v.id == id);
    if (!vehicle) return;
    
    closeVehicleModal();

    // Set modal to Edit mode
    document.getElementById('modalTitle').textContent = "Edit Vehicle Details";
    document.getElementById('submitBtn').textContent = "Save Changes";
    document.getElementById('editIndex').value = id;
    
    // Fill form with current data
    const nameParts = vehicle.name.split(' ');
    document.getElementById('carBrand').value = nameParts[0] || '';
    document.getElementById('carModel').value = nameParts.slice(1).join(' ') || '';
    document.getElementById('fuelType').value = vehicle.fuelType;
    document.getElementById('carType').value = vehicle.type || 'SUV';
    document.getElementById('pricePerDay').value = vehicle.pricePerDay;
    document.getElementById('availabilityStatus').value = vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1).toLowerCase();
    document.getElementById('pickupLocation').value = vehicle.location || '';
    document.getElementById('allowHandover').checked = vehicle.allowHandover !== false;
    
    document.getElementById('addVehicleModalOverlay').classList.add('active');
}

function renderVehicles() {
    if (myVehicles.length === 0) {
        vehiclesGrid.innerHTML = `
            <div style="grid-column: 1/-1;">
                <div style="text-align: center; padding: 80px 20px; color: var(--text-sub);">
                    <div style="font-size: 64px; margin-bottom: 20px;"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></div>
                    <h3 style="color: var(--text-main); margin-bottom: 10px; font-size: 20px;">No Vehicles Listed</h3>
                    <p style="margin: 0; margin-bottom: 30px; line-height: 1.6;">You haven't listed any vehicles yet. Start earning by listing your car today!</p>
                    <button class="empty-state-btn" onclick="openAddVehicleModal()">+ List Your Vehicle</button>
                </div>
            </div>
        `;
        return;
    }

    vehiclesGrid.innerHTML = myVehicles.map((vehicle) => `
        <div class="vehicle-card">
            <div onclick='openVehicleModal(${JSON.stringify(vehicle).replace(/'/g, "&apos;")})'>
                <img src="${vehicle.imageUrl || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=2000'}" alt="${vehicle.name}" class="vehicle-card-image">
                <div class="vehicle-card-header">
                    <h3 class="vehicle-card-title">${vehicle.name}</h3>
                    <p class="vehicle-card-type">${vehicle.type}</p>
                </div>
                <div class="vehicle-card-body">
                    <div class="vehicle-info-row">
                        <span class="vehicle-info-label">Daily Rate</span>
                        <span class="vehicle-info-value vehicle-info-rate">₹${vehicle.pricePerDay.toLocaleString('en-IN')}</span>
                    </div>
                    <div class="vehicle-info-row">
                        <span class="vehicle-info-label">Fuel</span>
                        <span class="vehicle-info-value">${vehicle.fuelType}</span>
                    </div>
                    <div class="vehicle-info-row">
                        <span class="vehicle-info-label">Status</span>
                        <span class="vehicle-status-badge ${vehicle.status.toLowerCase()}">${vehicle.status}</span>
                    </div>
                </div>
            </div>
            <div class="vehicle-card-footer">
                <button class="vehicle-card-btn primary" onclick='openVehicleModal(${JSON.stringify(vehicle).replace(/'/g, "&apos;")})'>Details</button>
                <button class="vehicle-card-btn secondary" onclick="editVehicle(${vehicle.id})">Edit</button>
            </div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', function() {
    fetchMyVehicles();
    
    // Vehicle Detail Modal
    const closeBtn = document.getElementById('closeVehicleModal');
    const modalOverlay = document.getElementById('vehicleModalOverlay');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeVehicleModal);
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(event) {
            if (event.target === modalOverlay) {
                closeVehicleModal();
            }
        });
    }

    // Modal Action Buttons
    const detailEditBtn = document.querySelector('.vehicle-modal .action-btn.primary');
    const detailHistoryBtn = document.querySelector('.vehicle-modal .action-btn.secondary');

    if (detailEditBtn) {
        detailEditBtn.addEventListener('click', () => {
            const carId = document.getElementById('vehicleModalOverlay').dataset.carId;
            editVehicle(carId);
        });
    }

    if (detailHistoryBtn) {
        detailHistoryBtn.addEventListener('click', viewRentalHistory);
    }

    // Add Vehicle Modal
    const addVehicleBtn = document.querySelector('.add-vehicle-btn');
    const closeAddBtn = document.getElementById('closeAddVehicleModal');
    const addModalOverlay = document.getElementById('addVehicleModalOverlay');
    const listingForm = document.getElementById('carListingForm');

    if (addVehicleBtn) {
        addVehicleBtn.addEventListener('click', openAddVehicleModal);
    }

    if (closeAddBtn) {
        closeAddBtn.addEventListener('click', closeAddVehicleModal);
    }

    if (addModalOverlay) {
        addModalOverlay.addEventListener('click', function(event) {
            if (event.target === addModalOverlay) {
                closeAddVehicleModal();
            }
        });
    }

    if (listingForm) {
        listingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const brand = document.getElementById('carBrand').value;
            const model = document.getElementById('carModel').value;
            const fuel = document.getElementById('fuelType').value;
            const type = document.getElementById('carType').value;
            const price = document.getElementById('pricePerDay').value;
            const status = document.getElementById('availabilityStatus').value.toUpperCase();
            const location = document.getElementById('pickupLocation').value;
            const allowHandover = document.getElementById('allowHandover').checked;
            const editId = parseInt(document.getElementById('editIndex').value);
            
            const submitBtn = document.getElementById('submitBtn');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = editId >= 0 ? "Updating..." : "Listing...";
            submitBtn.disabled = true;

            const carData = {
                name: `${brand} ${model}`,
                type: type, 
                fuelType: fuel,
                pricePerDay: parseInt(price),
                status: status,
                location: location,
                allowHandover: allowHandover,
                imageUrl: editId >= 0 ? myVehicles.find(v => v.id == editId).imageUrl : "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=2000"
            };
            
            try {
                let url = `http://${apiHost}:8080/api/cars`;
                let method = 'POST';
                if (editId >= 0) {
                    url = `http://${apiHost}:8080/api/cars/${editId}`;
                    method = 'PUT';
                } else {
                    url = `http://${apiHost}:8080/api/cars?userId=${user.id}`;
                }

                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(carData)
                });

                if (response.ok) {
                    alert(editId >= 0 ? 'Vehicle updated successfully!' : 'Your car has been listed successfully!');
                    fetchMyVehicles();
                    closeAddVehicleModal();
                } else {
                    alert("Failed to save vehicle. Please try again.");
                }
            } catch (error) {
                console.error('Error:', error);
                alert("An error occurred. Please try again.");
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Check for ?add=true query parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('add') === 'true') {
        openAddVehicleModal();
    }
});
