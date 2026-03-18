document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    const response = await fetch(`${API_BASE_URL}/auth/tokens/user/${user.id}`);

    // Fetch latest user data to get accurate trip points
    try {
        const res = await fetch(`${API_BASE_URL}/auth/users/${user.id}`);
        if (res.ok) {
            const updatedUser = await res.json();
            localStorage.setItem('user', JSON.stringify(updatedUser));
            updatePointsDisplay(updatedUser.tripPoints || 0);
        }
    } catch (err) {
        console.error("Error fetching user points:", err);
        updatePointsDisplay(user.tripPoints || 0);
    }

    function updatePointsDisplay(points) {
        const tokenEl = document.getElementById('total-tokens');
        const worthEl = document.querySelector('.balance-right');
        
        if (tokenEl) tokenEl.textContent = `${points} Trip Points`;
        if (worthEl) {
            // Assuming 1 point = 1 Rupee for now, or match existing 1:10 ratio if preferred
            // The user didn't specify the ratio, but token.html showed 340 -> 3400.
            // I'll stick to a 1:10 ratio if that's the design.
            const worth = (points * 10).toLocaleString('en-IN');
            worthEl.textContent = `Worth ₹${worth}`;
        }
    }

    // Dummy Transactions - In a real app, these would come from a Transactions table
    const transactions = [
        { 
            title: "Early return — Trip Points Earned", 
            date: new Date().toLocaleDateString(), 
            booking: "Recent", 
            amount: `+${user.tripPoints || 0}`, 
            type: "earned"
        }
    ];

    const listContainer = document.getElementById('transaction-list');

    function renderTransactions() {
        if (!listContainer) return;
        listContainer.innerHTML = transactions.map(tx => `
            <div class="transaction-item">
                <div class="tx-details">
                    <h4>${tx.title}</h4>
                    <p>${tx.date} • Booking ${tx.booking}</p>
                </div>
                <div style="text-align: right;">
                    <span style="font-weight: bold; display: block; margin-bottom: 5px;">
                        ${tx.amount}
                    </span>
                    <span class="tag ${tx.type}">${tx.type.toUpperCase()}</span>
                </div>
            </div>
        `).join('');
    }

    window.renderTransactions = renderTransactions;
    renderTransactions();
});