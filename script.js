const cars = [
    { id: 1, name: "BMW M3 Competition", type: "Luxury", price: 5000, image: "https://hips.hearstapps.com/hmg-prod/images/2025-bmw-m3-111-66562de0157ab.jpg?crop=0.827xw:0.622xh;0.163xw,0.254xh&resize=1200:*" },
    { id: 2, name: "Audi A6", type: "Sedan", price: 3500, image: "https://imgcdn.oto.com.sg/large/gallery/exterior/16/164/audi-a6-avant-front-angle-low-view-237284.jpg?tr=w-510,h-340" },
    { id: 3, name: "Mahindra Thar", type: "SUV", price: 2500, image: "https://spn-sta.spinny.com/blog/20230829170739/Spinny-Assured-Mahindra-Thar.webp" },
    { id: 4, name: "Mercedes AMG", type: "Luxury", price: 6000, image: "https://img-ik.cars.co.za/news-site-za/images/2021/02/mercedes-benz-c63-amg-3.jpg?tr=h-347,w-617,q-80" }
];

const reviews = [
    { name: "Bhagyashree Mishra", location: "Mumbai", time: "2 weeks ago", img: "https://randomuser.me/api/portraits/women/1.jpg", text: "TripGo made my weekend trip to Goa so convenient!", rating: 5 },
    { name: "Ayush Singh", location: "Delhi", time: "1 month ago", img: "https://randomuser.me/api/portraits/men/2.jpg", text: "As a car owner, TripGo has been a great source of passive income.", rating: 5 },
    { name: "Shweta Yadav", location: "Bangalore", time: "3 weeks ago", img: "https://randomuser.me/api/portraits/women/3.jpg", text: "Perfect for my business trips!", rating: 5 }
];

// 2. Display Functions
async function fetchFeaturedCars() {
    try {
        const response = await fetch(`${CAR_API_URL}/all`);
        if (response.ok) {
            const allCars = await response.json();
            // Show only first 4 cars as "Featured"
            displayCars(allCars.slice(0, 4));
        } else {
            // Fallback to static cars if backend fails
            displayCars(cars);
        }
    } catch (err) {
        console.error("Failed to fetch featured cars:", err);
        displayCars(cars);
    }
}

function displayCars(carList) {
    const container = document.getElementById('car-container');
    if(!container) return;

    if (carList.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 20px; color: #666;">No cars available.</p>';
        return;
    }

    container.innerHTML = carList.map(car => `
        <div class="car-card">
            <img src="${car.imageUrl || car.image || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80'}" class="car-image">
            <div class="car-info">
                <span class="car-type">${car.type}</span>
                <h3 class="car-name">${car.name}</h3>
                <div class="car-footer">
                    <span class="car-price">₹${car.pricePerDay || car.price}<small>/day</small></span>
                    <button class="rent-btn" onclick="window.location.href='browsecar.html'">Rent Now</button>
                </div>
            </div>
        </div>
    `).join('');
}

function loadTestimonials() {
    const container = document.getElementById('testimonial-container');
    if(!container) return;

    container.innerHTML = reviews.map(rev => `
        <div class="card">
            <div class="user-info">
                <img src="${rev.img}" class="user-img" alt="${rev.name}">
                <div class="user-meta">
                    <h4>${rev.name}</h4>
                    <span>${rev.location}</span>
                </div>
                <div class="stars">${'<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#FFD700;display:inline-block;vertical-align:middle;margin-right:2px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'.repeat(rev.rating)}</div>
            </div>
            <p class="comment">"${rev.text}"</p>
            <div class="card-footer">
                <span>${rev.time}</span>
                <span class="verified">Verified</span>
            </div>
        </div>
    `).join('');
}

// 3. Stats Update with Visual Feedback
function updateStats() {
    const totalCars = cars.length;
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 
        ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / totalReviews).toFixed(1) 
        : 4.8;

    const carEl = document.getElementById('count-cars');
    const reviewEl = document.getElementById('count-reviews');
    const rateEl = document.getElementById('avg-rating');

    if(carEl && reviewEl && rateEl) {
        [carEl, reviewEl, rateEl].forEach(el => {
            el.style.transform = "scale(1.2)";
            el.style.color = "#22c55e";
        });

        setTimeout(() => {
            carEl.innerText = totalCars.toLocaleString() + "+";
            reviewEl.innerText = (totalReviews + 10000).toLocaleString() + "+";
            rateEl.innerText = avgRating;

            [carEl, reviewEl, rateEl].forEach(el => {
                el.style.transform = "scale(1)";
                el.style.color = "#2563eb";
            });
        }, 200);
    }
}

// 4. Event Listeners & Logic
document.addEventListener('DOMContentLoaded', () => {
    fetchFeaturedCars();
    loadTestimonials();
    updateStats();

    // Filter Logic
    const filter = document.getElementById('type-filter');
    if(filter) {
        filter.addEventListener('change', async (e) => {
            const selected = e.target.value;
            try {
                const apiHost = window.location.hostname || '127.0.0.1';
                const response = await fetch(CAR_API_URL);
                if (response.ok) {
                    const allCarsFromBackend = await response.json();
                    const filtered = allCarsFromBackend.filter(car => selected === "All" || car.type === selected);
                    displayCars(filtered.slice(0, 4));
                }
            } catch (err) {
                const filtered = cars.filter(car => selected === "All" || car.type === selected);
                displayCars(filtered);
            }
        });
    }

    // Mobile Menu - ALERT REMOVED
    const menuBtn = document.getElementById('menu-btn');
    const navMenu = document.getElementById('nav-menu'); // Assuming you have a nav menu ID
    if(menuBtn && navMenu) {
        menuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active'); // Toggle a CSS class instead of showing an alert
        });
    }

    // Dynamic Year Update
    const copyrightText = document.querySelector('.footer-bottom p');
    if (copyrightText) {
        copyrightText.innerHTML = `© ${new Date().getFullYear()} TripGo. All rights reserved.`;
    }
});

// 5. New Car Listing Logic
const carForm = document.getElementById('car-form');
if(carForm) {
    carForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('carName').value;
        const price = document.getElementById('carPrice').value;
        const type = document.getElementById('carType').value;
        const imageFile = document.getElementById('carImage').files[0];

        const reader = new FileReader();
        reader.onload = function(event) {
            const imageUrl = event.target.result;
            
            // Push to data array
            cars.push({ id: cars.length + 1, name, type, price, image: imageUrl });
            // Refresh UI
            displayCars(cars);
            updateStats();
            carForm.reset();
        };

        if (imageFile) reader.readAsDataURL(imageFile);
    });
}
const menuBtn = document.getElementById('menu-btn');
const navLinks = document.querySelector('.nav-links');
const navAuth = document.querySelector('.nav-auth');

if(menuBtn) {
    menuBtn.addEventListener('click', () => {
        // Toggle the 'active' class on both containers
        navLinks.classList.toggle('active');
        navAuth.classList.toggle('active');
        
        // Optional: Change the button color when active
        menuBtn.style.color = navLinks.classList.contains('active') ? '#2563eb' : 'currentColor';
    });
}

// --- Dashboard & UI Logic ---
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

function requireAuth(targetPage) {
    const user = localStorage.getItem('user');
    if (!user) {
        alert('Please login to access this page.');
        window.location.href = 'login.html';
    } else {
        window.location.href = targetPage;
    }
}

// Profile Dropdown Logic
function initProfileDropdown() {
    const user = JSON.parse(localStorage.getItem('user'));
    const authSection = document.getElementById('nav-auth-section');
    
    if (user && authSection) {
        authSection.innerHTML = `
            <div class="user-profile-container">
                <div class="icon-btn profile-trigger" id="profile-trigger">
                </div>
                <div class="profile-dropdown" id="profile-dropdown">
                    <div class="dropdown-header">
                        <span></span>
                        <small></small>
                    </div>
                    <a href="${user.role === 'ADMIN' ? 'admin.html' : 'profile.html'}" class="dropdown-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        My Profile
                    </a>
                    <div class="dropdown-divider"></div>
                    <a href="#" onclick="logout()" class="dropdown-item logout">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        Logout
                    </a>
                </div>
            </div>
        `;

        // Wait for profile.js to be available for updateAllProfileIcons
        if (typeof updateAllProfileIcons === 'function') {
            updateAllProfileIcons();
        }
        
        const trigger = document.getElementById('profile-trigger');
        const dropdown = document.getElementById('profile-dropdown');

        if (trigger && dropdown) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('active');
            });

            document.addEventListener('click', () => {
                dropdown.classList.remove('active');
            });
        }
    }
}

// Add to main DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    initProfileDropdown();
});

// --- Shared Review & Rating Modal Logic (Global Scope) ---
function renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            stars += '<i class="fas fa-star" style="color: #f59e0b;"></i>';
        } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
            stars += '<i class="fas fa-star-half-alt" style="color: #f59e0b;"></i>';
        } else {
            stars += '<i class="far fa-star" style="color: #cbd5e1;"></i>';
        }
    }
    return stars;
}

async function loadReviews(carId, targetElementId = 'reviewsListPopup') {
    const reviewsList = document.getElementById(targetElementId);
    if (!reviewsList) return;

    try {
        const response = await fetch(`${API_BASE_URL}/reviews/car/${carId}`);
        const reviews = await response.json();

        if (reviews.length === 0) {
            reviewsList.innerHTML = '<p style="color: #64748b; font-size: 14px; text-align: center; padding: 40px;">No reviews yet. Be the first to rate this car!</p>';
        } else {
            reviewsList.innerHTML = reviews.map(r => {
                // Generate initials if no profile pic
                const initials = r.userName ? r.userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '?';
                const avatarContent = (r.userProfilePic && r.userProfilePic.trim() !== "") 
                    ? `<img src="${r.userProfilePic}" style="width: 100%; height: 100%; object-fit: cover;">`
                    : `<span style="font-weight: 700; color: #3b82f6; font-size: 14px;">${initials}</span>`;

                return `
                <div class="review-item" style="margin-bottom: 30px; padding: 20px; background: #fafafa; border-radius: 16px; border: 1px solid #f1f5f9;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 44px; height: 44px; background: #eff6ff; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                                ${avatarContent}
                            </div>
                            <div>
                                <h4 style="margin: 0; font-size: 15px; font-weight: 700; color: #1e293b;">${r.userName || 'Verified User'}</h4>
                                <span style="font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${new Date(r.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                        </div>
                        <div style="background: white; border-radius: 8px; padding: 4px 8px; border: 1px solid #f1f5f9; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                            <i class="fas fa-star" style="color: #f59e0b; font-size: 12px;"></i>
                            <span style="font-weight: 800; font-size: 13px; color: #1e293b;">${r.rating}</span>
                        </div>
                    </div>
                    <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0; padding-left: 2px;">${r.comment}</p>
                </div>
                `;
            }).join('');
        }
    } catch (err) {
        console.error("Failed to load reviews:", err);
        reviewsList.innerHTML = '<p style="color: #ef4444; font-size: 13px; text-align: center; padding: 20px;">Error loading reviews.</p>';
    }
}

function openReviewsModal(carId) {
    const overlay = document.getElementById('reviewsModalOverlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    document.getElementById('reviewsListPopup').innerHTML = '<p style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin"></i> Loading reviews...</p>';
    loadReviews(carId, 'reviewsListPopup');
}

function closeReviewsModal() {
    const overlay = document.getElementById('reviewsModalOverlay');
    if (overlay) overlay.style.display = 'none';
}

function openRateModal(carId, carName) {
    const modal = document.getElementById('rateModalOverlay');
    if (!modal) return;
    modal.setAttribute('data-current-car-id', carId);
    document.getElementById('rateCarName').textContent = carName;
    
    // Reset Form
    document.getElementById('reviewCommentModal').value = '';
    document.getElementById('selectedRatingModal').value = '0';
    document.querySelectorAll('.rating-star-modal').forEach(s => {
        s.style.color = '#cbd5e1';
        s.classList.replace('fas', 'far');
    });
    
    modal.style.display = 'flex';
}

function closeRateModal() {
    const modal = document.getElementById('rateModalOverlay');
    if (modal) modal.style.display = 'none';
}


// --- Review Prevention System ---
window.userReviews = [];

async function fetchUserReviews() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/reviews/user/${user.id}`);
        if (response.ok) {
            window.userReviews = await response.json();
            console.log("FRESH REVIEWS FETCHED:", window.userReviews);
        }
    } catch (err) {
        console.error("Failed to fetch user reviews:", err);
    }
}

// Update submitReview to refresh the list
async function submitReview() {
    const carId = document.getElementById('rateModalOverlay').getAttribute('data-current-car-id');
    const rating = document.getElementById('selectedRatingModal').value;
    const comment = document.getElementById('reviewCommentModal').value;
    const errorEl = document.getElementById('reviewErrorModal');
    const submitBtn = document.getElementById('submitReviewBtnModal');

    if (!rating || rating === '0') {
        errorEl.textContent = "Please select a star rating.";
        errorEl.style.display = 'block';
        return;
    }
    
    if (!comment.trim()) {
        errorEl.textContent = "Please share your experience.";
        errorEl.style.display = 'block';
        return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert("Please login to submit a review.");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try {
        const payload = {
            carId: parseInt(carId),
            userId: user.id,
            userName: user.fullName || user.name || 'Verified User',
            userProfilePic: user.profilePic || null, 
            rating: parseInt(rating),
            comment: comment.trim()
        };

        const response = await fetch(`${API_BASE_URL}/reviews/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Thank you! Your review has been submitted.");
            closeRateModal();
            
            // Refresh reviews list
            await fetchUserReviews();
            
            // Refresh UI if necessary
            if (typeof renderRecentBookings === 'function') {
                // We need to re-render the bookings to hide the button
                // This might need a reference to the data, 
                // but usually fetchDashboardStats does this.
                if (typeof fetchDashboardStats === 'function') fetchDashboardStats();
            }
            
            // Refresh cars if on browse page
            if (typeof fetchCars === 'function') fetchCars();
        } else {
            const err = await response.text();
            throw new Error(err || "Failed to submit review.");
        }
    } catch (err) {
        console.error("Review error:", err);
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit My Review";
    }
}

// Event delegation for Review Modal Star Behavior
document.addEventListener('mouseover', (e) => {
    if (e.target.classList.contains('rating-star-modal')) {
        const val = parseInt(e.target.getAttribute('data-value'));
        const stars = document.querySelectorAll('.rating-star-modal');
        stars.forEach(s => {
            const sVal = parseInt(s.getAttribute('data-value'));
            if (sVal <= val) {
                s.style.color = '#f59e0b';
                s.classList.replace('far', 'fas');
            } else {
                s.style.color = '#cbd5e1';
                s.classList.replace('fas', 'far');
            }
        });
    }
});

document.addEventListener('mouseout', (e) => {
    if (e.target.classList.contains('rating-star-modal')) {
        const selected = parseInt(document.getElementById('selectedRatingModal').value) || 0;
        const stars = document.querySelectorAll('.rating-star-modal');
        stars.forEach(s => {
            const sVal = parseInt(s.getAttribute('data-value'));
            if (sVal <= selected) {
                s.style.color = '#f59e0b';
                s.classList.replace('far', 'fas');
            } else {
                s.style.color = '#cbd5e1';
                s.classList.replace('fas', 'far');
            }
        });
    }
});

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('rating-star-modal')) {
        const val = e.target.getAttribute('data-value');
        document.getElementById('selectedRatingModal').value = val;
        const stars = document.querySelectorAll('.rating-star-modal');
        stars.forEach(s => {
            const sVal = parseInt(s.getAttribute('data-value'));
            if (sVal <= parseInt(val)) {
                s.style.color = '#f59e0b';
                s.classList.replace('far', 'fas');
            } else {
                s.style.color = '#cbd5e1';
                s.classList.replace('fas', 'far');
            }
        });
    }
    
    if (e.target.id === 'submitReviewBtnModal') {
        submitReview();
    }
    
    if (event.target.id === 'reviewsModalOverlay') closeReviewsModal();
    if (event.target.id === 'rateModalOverlay') closeRateModal();
});
