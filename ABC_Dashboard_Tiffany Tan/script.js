// Inventory Management System - JavaScript

let inventoryChart = null; // Chart.js instance reference

// Initialize the app when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupEventListeners();
    loadAndDisplayInventory();
    updateProfileStats();
});

// Setup event listeners
function setupEventListeners() {
    const inventoryForm = document.getElementById('inventoryForm');
    const clearDataBtn = document.getElementById('clearDataBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');

    if (inventoryForm) {
        inventoryForm.addEventListener('submit', handleAddItem);
    }

    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', handleClearData);
    }

    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', handleClearAllItems);
    }
}

// Initialize page - highlight active nav link
function initializePage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

// Handle adding new item
function handleAddItem(event) {
    event.preventDefault();

    const itemName = document.getElementById('itemName').value.trim();
    const itemQuantity = parseInt(document.getElementById('itemQuantity').value);
    const itemPrice = parseFloat(document.getElementById('itemPrice').value);

    // Validation: Check if item name is empty
    if (!itemName) {
        showNotification('Please enter an item name', 'error');
        return;
    }

    // Validation: Check for quantity is at least 1
    if (isNaN(itemQuantity) || itemQuantity < 1) {
        showNotification('Quantity must be at least 1', 'error');
        return;
    }

    // Validation: Check for price is not negative
    if (isNaN(itemPrice) || itemPrice < 0) {
        showNotification('Price cannot be negative', 'error');
        return;
    }

    // Get existing inventory from localStorage
    const inventory = getInventoryFromLocalStorage();

    // Validation: Check for duplicate item names (case-insensitive)
    const isDuplicate = inventory.some(item => 
        item.name.toLowerCase() === itemName.toLowerCase()
    );

    if (isDuplicate) {
        showNotification(`Item "${itemName}" already exists in your inventory`, 'error');
        document.getElementById('itemName').focus();
        return;
    }

    // Create item object
    const item = {
        id: Date.now(),
        name: itemName,
        quantity: itemQuantity,
        price: itemPrice,
        dateAdded: new Date().toLocaleDateString()
    };

    // Add new item
    inventory.push(item);

    // Save to localStorage
    saveInventoryToLocalStorage(inventory);

    // Clear form
    event.target.reset();
    document.getElementById('itemName').focus();

    // Refresh display
    loadAndDisplayInventory();

    // Show success message
    showNotification('Item added successfully!', 'success');
}

// Load inventory from localStorage
function getInventoryFromLocalStorage() {
    const data = localStorage.getItem('abcInventory');
    return data ? JSON.parse(data) : [];
}

// Save inventory to localStorage
function saveInventoryToLocalStorage(inventory) {
    localStorage.setItem('abcInventory', JSON.stringify(inventory));
}

// Load and display inventory
function loadAndDisplayInventory() {
    const inventory = getInventoryFromLocalStorage();
    const inventoryList = document.getElementById('inventoryList');
    const clearAllBtn = document.getElementById('clearAllBtn');

    if (!inventoryList) return;

    // Show/hide clear all button based on inventory
    if (clearAllBtn) {
        clearAllBtn.style.display = inventory.length > 0 ? 'block' : 'none';
    }

    if (inventory.length === 0) {
        inventoryList.innerHTML = '<p class="empty-message">No items yet. Add an item to get started!</p>';
        updateChart([]);
        return;
    }

    // Create HTML for inventory items
    inventoryList.innerHTML = inventory.map(item => `
        <div class="inventory-item ${item.quantity < 10 ? 'low-stock' : ''}">
            <div class="inventory-item-header">
                <span class="item-name">${escapeHtml(item.name)}</span>
                <button class="btn-delete" onclick="deleteItem(${item.id})">Delete</button>
            </div>
            <div class="item-details">
                <div class="detail">
                    <p class="detail-label">Quantity</p>
                    <p class="detail-value">${item.quantity}</p>
                </div>
                <div class="detail">
                    <p class="detail-label">Unit Price</p>
                    <p class="detail-value">$${item.price.toFixed(2)}</p>
                </div>
                <div class="detail">
                    <p class="detail-label">Total Value</p>
                    <p class="detail-value">$${(item.quantity * item.price).toFixed(2)}</p>
                </div>
                <div class="detail">
                    <p class="detail-label">Date Added</p>
                    <p class="detail-value">${item.dateAdded}</p>
                </div>
            </div>
        </div>
    `).join('');

    // Update chart with inventory data
    updateChart(inventory);

    // Update profile stats
    updateProfileStats();
}

// Delete item from inventory
function deleteItem(itemId) {
    if (confirm('Are you sure you want to delete this item?')) {
        const inventory = getInventoryFromLocalStorage();
        const filteredInventory = inventory.filter(item => item.id !== itemId);
        saveInventoryToLocalStorage(filteredInventory);
        loadAndDisplayInventory();
        showNotification('Item deleted successfully!', 'success');
    }
}

// Update profile statistics
function updateProfileStats() {
    const totalItemsElement = document.getElementById('totalItems');
    const totalValueElement = document.getElementById('totalValue');
    const totalQtyElement = document.getElementById('totalQty');

    if (!totalItemsElement) return; // Only run on profile page

    const inventory = getInventoryFromLocalStorage();

    const stats = inventory.reduce((acc, item) => {
        return {
            itemCount: acc.itemCount + 1,
            totalQty: acc.totalQty + item.quantity,
            totalValue: acc.totalValue + (item.quantity * item.price)
        };
    }, { itemCount: 0, totalQty: 0, totalValue: 0 });

    if (totalItemsElement) totalItemsElement.textContent = stats.itemCount;
    if (totalValueElement) totalValueElement.textContent = '$' + stats.totalValue.toFixed(2);
    if (totalQtyElement) totalQtyElement.textContent = stats.totalQty;
}

// Clear all items from inventory list (Dashboard)
function handleClearAllItems() {
    const inventory = getInventoryFromLocalStorage();
    
    if (inventory.length === 0) {
        showNotification('No items to clear', 'error');
        return;
    }

    if (confirm('Are you sure you want to delete ALL items from the inventory? This cannot be undone.')) {
        localStorage.removeItem('abcInventory');
        loadAndDisplayInventory();
        updateProfileStats();
        showNotification('All items cleared successfully!', 'success');
    }
}

// Clear all data (Profile page)
function handleClearData() {
    if (confirm('Are you sure you want to delete ALL inventory data? This cannot be undone.')) {
        localStorage.removeItem('abcInventory');
        loadAndDisplayInventory();
        updateProfileStats();
        showNotification('All data cleared!', 'success');
    }
}

// Update Chart.js visualization
function updateChart(inventory) {
    const canvas = document.getElementById('inventoryChart');
    if (!canvas) return; // Only run if chart canvas exists

    // Prepare data for chart
    const itemNames = inventory.map(item => item.name);
    const quantities = inventory.map(item => item.quantity);
    
    // Create colors - Red for low stock (< 10), Electric Blue for normal
    const colors = inventory.map(item => 
        item.quantity < 10 ? '#ff006e' : '#0080ff'
    );

    // Destroy existing chart if it exists
    if (inventoryChart) {
        inventoryChart.destroy();
    }

    // If no items, show empty chart message
    if (inventory.length === 0) {
        return;
    }

    // Create new chart
    inventoryChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: itemNames,
            datasets: [{
                label: 'Quantity in Stock',
                data: quantities,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 2,
                borderRadius: 5,
                hoverBackgroundColor: colors.map(color => 
                    color === '#ff006e' ? '#ff0052' : '#0066cc'
                ),
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'x',
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#2b3e50',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        afterLabel: function(context) {
                            const item = inventory[context.dataIndex];
                            if (item.quantity < 10) {
                                return '⚠️ LOW STOCK!';
                            }
                            return '';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#2b3e50',
                        font: {
                            weight: '500'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 128, 255, 0.1)',
                        drawBorder: true
                    },
                    title: {
                        display: true,
                        text: 'Quantity',
                        color: '#2b3e50'
                    }
                },
                x: {
                    ticks: {
                        color: '#2b3e50',
                        font: {
                            weight: '500'
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Show notification message
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 4px;
        background: ${type === 'success' ? 'linear-gradient(90deg, #00cc44, #00aa33)' : 'linear-gradient(90deg, #ff6b6b, #ff5252)'};
        color: white;
        font-weight: 600;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
