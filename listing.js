document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('carListingForm');

    form.addEventListener('submit', (e) => {
        e.preventDefault(); // Page refresh hone se rokne ke liye

        // 1. Basic Validation check
        const carBrand = document.getElementById('carBrand').value;
        const carModel = document.getElementById('carModel').value;
        const price = document.getElementById('pricePerDay').value;
        const location = document.getElementById('pickupLocation').value;
        const carType = document.getElementById('carType').value;
        const fuelType = document.getElementById('fuelType').value;
        const ownerName = document.getElementById('ownerName').value;
        const ownerEmail = document.getElementById('ownerEmail').value;
        const transmission = document.getElementById('transmission').value;
        const seating = document.getElementById('seating').value;
        const luggage = document.getElementById('luggage').value;
        const deposit = document.getElementById('refundableDeposit').value;
        const allowHandover = document.getElementById('allowHandover').checked;
        const selectedFuelOption = document.querySelector('input[name="fuelOption"]:checked').value;
        const fuelChargesIncluded = (selectedFuelOption === 'include');
        const nearbyHub = document.getElementById('nearbyHub').value;
 
        if (!carBrand || !carModel || !price || !location || !ownerName || !ownerEmail || !nearbyHub) {
            alert("Please fill all mandatory fields including Near by Hub!");
            return;
        }

        // 2. Button Animation (Loading state)
        const submitBtn = document.querySelector('.submit-btn');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = "Listing your car...";
        submitBtn.style.opacity = "0.7";
        submitBtn.disabled = true;

        // 3. Real Backend Call
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.id) {
            console.error("User not logged in or missing ID when attempting to list car");
            alert("Session error. Please login again.");
            window.location.href = 'login.html';
            return;
        }
        console.log("Listing car for user ID:", user.id);
        if (!user) {
            alert("Please login to list your car!");
            window.location.href = 'login.html';
            return;
        }

        const imageFile = document.getElementById('carImage').files[0];
        let base64Image = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80'; // Placeholder for now

        const submitCarData = (imgUrl) => {
            const carData = {
                name: `${carBrand || 'Car'} ${carModel || ''}`,
                type: carType || 'SUV',
                location: location || 'Not Specified',
                pricePerDay: parseInt(price) || 0,
                fuelType: fuelType || 'Petrol',
                status: 'AVAILABLE',
                imageUrl: imgUrl, 
                ownerName: ownerName || 'Renter',
                ownerEmail: ownerEmail || '',
                transmission: transmission || 'Manual',
                seating: parseInt(seating) || 5,
                luggage: parseInt(luggage) || 2,
                refundableDeposit: parseInt(deposit) || 0,
                allowHandover: allowHandover,
                fuelChargesIncluded: fuelChargesIncluded,
                nearbyHub: nearbyHub
            };

            const apiHost = window.location.hostname || '127.0.0.1';
            const userId = user.id;
            console.log(`Attempting to list car for user ${userId} at ${apiHost}`);
            fetch(`${CAR_API_URL}/store?userId=${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(carData)
            })
            .then(async response => {
                if (response.ok) {
                    return response.json();
                }
                const errText = await response.text();
                throw new Error(`Server Error (${response.status}): ${errText}`);
            })
            .then(data => {
                // Success Feedback
                showSuccessMessage(carBrand, carModel);
                
                // Form Reset
                form.reset();

                // Redirect to Browse Cars after short delay so user can see their car
                setTimeout(() => {
                    window.location.href = 'browsecar.html';
                }, 3000);
            })
            .catch(error => {
                console.error('Listing Error Details:', error);
                alert(`Failed to list car: ${error.message}. Check console for details.`);
            })
            .finally(() => {
                // Re-enable Button
                submitBtn.innerText = originalText;
                submitBtn.style.opacity = "1";
                submitBtn.disabled = false;
            });
        };

        if (imageFile) {
            const reader = new FileReader();
            reader.onload = function(event) {
                submitCarData(event.target.result);
            };
            reader.onerror = function(error) {
                console.error('Error reading file:', error);
                submitCarData(base64Image); // Use fallback on error
            };
            reader.readAsDataURL(imageFile);
        } else {
            submitCarData(base64Image); // No image selected
        }
    });
    // Autopopulate Owner Info from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        if (document.getElementById('ownerName')) document.getElementById('ownerName').value = user.fullName || '';
        if (document.getElementById('ownerEmail')) document.getElementById('ownerEmail').value = user.email || '';
    }
});

// Success Message Function
function showSuccessMessage(brand, model) {
    // Ek sundar alert box create karna
    const alertBox = document.createElement('div');
    alertBox.style.position = 'fixed';
    alertBox.style.top = '20px';
    alertBox.style.right = '20px';
    alertBox.style.padding = '20px';
    alertBox.style.background = 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)';
    alertBox.style.color = 'white';
    alertBox.style.borderRadius = '10px';
    alertBox.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
    alertBox.style.zIndex = '1000';
    alertBox.innerHTML = `
        <strong>Success!</strong><br>
        Your ${brand} ${model} has been listed on TripGo.
    `;

    document.body.appendChild(alertBox);

    // 4 second baad message gayab ho jayega
    setTimeout(() => {
        alertBox.style.transition = '0.5s';
        alertBox.style.opacity = '0';
        setTimeout(() => alertBox.remove(), 500);
    }, 4000);
}