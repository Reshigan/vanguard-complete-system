/**
 * Verifi AI Consumer Portal JavaScript
 * 
 * This file handles all frontend functionality for the consumer portal including:
 * - Navigation and section switching
 * - Product scanning and verification
 * - Rewards system interaction
 * - AI chat integration
 * - Profile management
 * - Real-time updates
 */

class VerifiAIConsumer {
    constructor() {
        this.apiBaseUrl = window.location.hostname === 'localhost' ? 
            'http://localhost:3001/api' : '/api';
        this.currentUser = null;
        this.chatSession = null;
        this.scanner = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadUserData();
        this.loadHistoryData();
        this.initializeChat();
        this.checkNotifications();
        
        // Show home section by default
        this.showSection('home');
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.getAttribute('data-section');
                this.showSection(section);
                this.updateNavigation(section);
            });
        });
        
        // Scanner functionality
        document.getElementById('startScanBtn')?.addEventListener('click', () => {
            this.startScanner();
        });
        
        document.getElementById('verifyManualBtn')?.addEventListener('click', () => {
            this.verifyManualCode();
        });
        
        // Demo codes
        document.querySelectorAll('.demo-code').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const code = e.currentTarget.getAttribute('data-code');
                document.getElementById('manualCode').value = code;
                this.verifyManualCode();
            });
        });
        
        // Rewards
        document.querySelectorAll('[data-reward]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reward = e.currentTarget.getAttribute('data-reward');
                this.redeemReward(reward);
            });
        });
        
        // History filters
        document.querySelectorAll('[data-filter]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.currentTarget.getAttribute('data-filter');
                this.filterHistory(filter);
                this.updateFilterButtons(e.currentTarget);
            });
        });
        
        // Profile form
        document.getElementById('profileForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProfile();
        });
        
        // Chat functionality
        document.getElementById('chatToggle')?.addEventListener('click', () => {
            this.toggleChat();
        });
        
        document.getElementById('chatClose')?.addEventListener('click', () => {
            this.closeChat();
        });
        
        document.getElementById('chatSend')?.addEventListener('click', () => {
            this.sendChatMessage();
        });
        
        document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });
        
        // Modal events
        document.getElementById('shareResultBtn')?.addEventListener('click', () => {
            this.shareResult();
        });
    }
    
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.classList.add('fade-in');
        }
        
        // Load section-specific data
        this.loadSectionData(sectionName);
    }
    
    updateNavigation(activeSection) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        document.querySelectorAll(`[data-section="${activeSection}"]`).forEach(link => {
            if (link.classList.contains('nav-link')) {
                link.classList.add('active');
            }
        });
    }
    
    loadSectionData(section) {
        switch (section) {
            case 'home':
                this.loadDashboardData();
                break;
            case 'history':
                this.loadHistoryData();
                break;
            case 'rewards':
                this.loadRewardsData();
                break;
            case 'profile':
                this.loadProfileData();
                break;
        }
    }
    
    async loadUserData() {
        try {
            // Mock user data - in production, fetch from API
            this.currentUser = {
                id: 'user123',
                name: 'John Doe',
                email: 'john.doe@example.com',
                points: 1250,
                level: 'Gold Verifier',
                verifications: 47,
                counterfeits: 3,
                referrals: 12
            };
            
            this.updateUserDisplay();
        } catch (error) {
            console.error('Error loading user data:', error);
            this.showNotification('Error loading user data', 'error');
        }
    }
    
    updateUserDisplay() {
        if (!this.currentUser) return;
        
        // Update points display
        document.getElementById('userPoints').textContent = this.currentUser.points.toLocaleString();
        
        // Update user name
        document.querySelectorAll('.user-name').forEach(el => {
            el.textContent = this.currentUser.name;
        });
        
        // Update stats
        const stats = document.querySelectorAll('.stat-content h3');
        if (stats.length >= 4) {
            stats[0].textContent = this.currentUser.verifications;
            stats[1].textContent = this.currentUser.points.toLocaleString();
            stats[2].textContent = this.currentUser.counterfeits;
            stats[3].textContent = this.currentUser.referrals;
        }
    }
    
    async loadDashboardData() {
        try {
            // Mock dashboard data
            const dashboardData = {
                recentActivity: [
                    {
                        id: 1,
                        type: 'verification',
                        product: 'Johnnie Walker Blue Label',
                        result: 'authentic',
                        points: 50,
                        time: '2 hours ago'
                    },
                    {
                        id: 2,
                        type: 'report',
                        product: 'Hennessy XO',
                        result: 'counterfeit',
                        points: 200,
                        time: '1 day ago'
                    },
                    {
                        id: 3,
                        type: 'reward',
                        product: '$10 Amazon Gift Card',
                        result: 'redeemed',
                        points: -500,
                        time: '3 days ago'
                    }
                ]
            };
            
            this.updateRecentActivity(dashboardData.recentActivity);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }
    
    updateRecentActivity(activities) {
        const activityList = document.querySelector('.activity-list');
        if (!activityList) return;
        
        activityList.innerHTML = activities.map(activity => {
            const iconClass = activity.result === 'authentic' ? 'bg-success' : 
                             activity.result === 'counterfeit' ? 'bg-danger' : 'bg-warning';
            const icon = activity.type === 'verification' ? 'check-circle' :
                        activity.type === 'report' ? 'exclamation-triangle' : 'gift';
            const badgeClass = activity.result === 'authentic' ? 'bg-success' :
                              activity.result === 'counterfeit' ? 'bg-danger' : 'bg-warning';
            
            return `
                <div class="activity-item">
                    <div class="activity-icon ${iconClass}">
                        <i class="bi bi-${icon}"></i>
                    </div>
                    <div class="activity-content">
                        <h6>${activity.product} ${activity.type === 'verification' ? 'verified' : activity.type === 'report' ? 'reported' : 'redeemed'}</h6>
                        <p class="text-muted mb-1">${activity.result === 'authentic' ? 'Authentic product confirmed' : 
                                                     activity.result === 'counterfeit' ? 'Counterfeit detected and reported' :
                                                     activity.result === 'redeemed' ? 'Reward successfully redeemed' : activity.result}</p>
                        <small class="text-muted">${activity.time} • ${activity.points > 0 ? '+' : ''}${activity.points} points</small>
                    </div>
                    <div class="activity-badge">
                        <span class="badge ${badgeClass}">${activity.result.charAt(0).toUpperCase() + activity.result.slice(1)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    async startScanner() {
        try {
            const video = document.getElementById('scanner-video');
            const placeholder = document.getElementById('scanner-placeholder');
            
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera not supported');
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            
            video.srcObject = stream;
            video.classList.remove('d-none');
            placeholder.classList.add('d-none');
            
            video.play();
            
            // Start QR code detection (mock implementation)
            this.startQRDetection(video);
            
        } catch (error) {
            console.error('Error starting scanner:', error);
            this.showNotification('Camera access denied or not available', 'error');
        }
    }
    
    startQRDetection(video) {
        // Mock QR detection - in production, use a QR code library
        setTimeout(() => {
            this.stopScanner();
            this.verifyProduct('JW-BLUE-001');
        }, 3000);
    }
    
    stopScanner() {
        const video = document.getElementById('scanner-video');
        const placeholder = document.getElementById('scanner-placeholder');
        
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }
        
        video.classList.add('d-none');
        placeholder.classList.remove('d-none');
    }
    
    async verifyManualCode() {
        const code = document.getElementById('manualCode').value.trim();
        if (!code) {
            this.showNotification('Please enter a product code', 'warning');
            return;
        }
        
        await this.verifyProduct(code);
    }
    
    async verifyProduct(code) {
        try {
            this.showLoading('Verifying product...');
            
            // Mock verification - in production, call API
            const mockResults = {
                'JW-BLUE-001': {
                    authentic: true,
                    product: 'Johnnie Walker Blue Label',
                    manufacturer: 'Diageo',
                    batch: 'JW2023-001',
                    productionDate: '2023-08-15',
                    location: 'Scotland',
                    confidence: 98.5
                },
                'HENNESSY-XO-002': {
                    authentic: false,
                    product: 'Hennessy XO',
                    manufacturer: 'Hennessy',
                    reason: 'Invalid authentication token',
                    riskLevel: 'High',
                    confidence: 95.2
                },
                'JACK-SB-003': {
                    authentic: true,
                    product: 'Jack Daniels Single Barrel',
                    manufacturer: 'Jack Daniel Distillery',
                    batch: 'JD2023-SB-003',
                    productionDate: '2023-09-20',
                    location: 'Tennessee, USA',
                    confidence: 97.8
                }
            };
            
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
            
            const result = mockResults[code] || {
                authentic: false,
                product: 'Unknown Product',
                reason: 'Product code not found in database',
                riskLevel: 'Unknown',
                confidence: 0
            };
            
            this.hideLoading();
            this.showVerificationResult(result);
            
            // Award points for verification
            if (result.authentic) {
                this.awardPoints(50, 'Product verification');
            } else {
                this.awardPoints(200, 'Counterfeit detection');
            }
            
        } catch (error) {
            this.hideLoading();
            console.error('Error verifying product:', error);
            this.showNotification('Error verifying product', 'error');
        }
    }
    
    showVerificationResult(result) {
        const modal = new bootstrap.Modal(document.getElementById('verificationModal'));
        const resultContainer = document.getElementById('verificationResult');
        
        const iconClass = result.authentic ? 'authentic' : 'counterfeit';
        const icon = result.authentic ? 'check-circle-fill' : 'x-circle-fill';
        const title = result.authentic ? 'Authentic Product' : 'Counterfeit Detected';
        const titleClass = result.authentic ? 'text-success' : 'text-danger';
        
        resultContainer.innerHTML = `
            <div class="verification-result">
                <div class="result-icon ${iconClass}">
                    <i class="bi bi-${icon}"></i>
                </div>
                <h4 class="result-title ${titleClass}">${title}</h4>
                <div class="result-details">
                    <h6>Product Information</h6>
                    <p><strong>Product:</strong> ${result.product}</p>
                    ${result.manufacturer ? `<p><strong>Manufacturer:</strong> ${result.manufacturer}</p>` : ''}
                    ${result.batch ? `<p><strong>Batch:</strong> ${result.batch}</p>` : ''}
                    ${result.productionDate ? `<p><strong>Production Date:</strong> ${result.productionDate}</p>` : ''}
                    ${result.location ? `<p><strong>Location:</strong> ${result.location}</p>` : ''}
                    ${result.reason ? `<p><strong>Issue:</strong> ${result.reason}</p>` : ''}
                    ${result.riskLevel ? `<p><strong>Risk Level:</strong> ${result.riskLevel}</p>` : ''}
                    <p><strong>Confidence:</strong> ${result.confidence}%</p>
                </div>
                ${result.authentic ? 
                    '<div class="alert alert-success">✅ This product is verified as authentic!</div>' :
                    '<div class="alert alert-danger">⚠️ This product may be counterfeit. Please report it.</div>'
                }
            </div>
        `;
        
        modal.show();
    }
    
    async redeemReward(rewardType) {
        try {
            const rewards = {
                'amazon-5': { name: '$5 Amazon Gift Card', cost: 250 },
                'starbucks': { name: 'Starbucks Coffee', cost: 400 },
                'amazon-10': { name: '$10 Amazon Gift Card', cost: 500 },
                'accessories': { name: 'Phone Accessories', cost: 750 },
                'movies': { name: 'Movie Tickets', cost: 1000 }
            };
            
            const reward = rewards[rewardType];
            if (!reward) return;
            
            if (this.currentUser.points < reward.cost) {
                this.showNotification('Insufficient points for this reward', 'warning');
                return;
            }
            
            const confirmed = confirm(`Redeem ${reward.name} for ${reward.cost} points?`);
            if (!confirmed) return;
            
            this.showLoading('Processing redemption...');
            
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Update user points
            this.currentUser.points -= reward.cost;
            this.updateUserDisplay();
            
            this.hideLoading();
            this.showNotification(`Successfully redeemed ${reward.name}!`, 'success');
            
        } catch (error) {
            this.hideLoading();
            console.error('Error redeeming reward:', error);
            this.showNotification('Error redeeming reward', 'error');
        }
    }
    
    awardPoints(points, reason) {
        this.currentUser.points += points;
        this.updateUserDisplay();
        this.showNotification(`+${points} points earned for ${reason}!`, 'success');
    }
    
    async loadHistoryData() {
        try {
            // Mock history data
            const historyData = [
                {
                    id: 1,
                    product: 'Johnnie Walker Blue Label',
                    code: 'JW-BLUE-001',
                    result: 'authentic',
                    date: '2023-12-01T14:30:00Z',
                    location: 'New York, NY',
                    points: 50
                },
                {
                    id: 2,
                    product: 'Hennessy XO',
                    code: 'HENNESSY-XO-002',
                    result: 'counterfeit',
                    date: '2023-11-30T09:15:00Z',
                    location: 'New York, NY',
                    points: 200
                },
                {
                    id: 3,
                    product: 'Jack Daniels Single Barrel',
                    code: 'JACK-SB-003',
                    result: 'authentic',
                    date: '2023-11-29T16:45:00Z',
                    location: 'New York, NY',
                    points: 50
                }
            ];
            
            this.displayHistory(historyData);
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }
    
    displayHistory(historyData) {
        const historyList = document.querySelector('.history-list');
        if (!historyList) return;
        
        historyList.innerHTML = historyData.map(item => {
            const date = new Date(item.date).toLocaleDateString();
            const time = new Date(item.date).toLocaleTimeString();
            const iconClass = item.result === 'authentic' ? 'bg-success' : 'bg-danger';
            const icon = item.result === 'authentic' ? 'check-circle' : 'x-circle';
            const badgeClass = item.result === 'authentic' ? 'bg-success' : 'bg-danger';
            
            return `
                <div class="activity-item" data-filter="${item.result}">
                    <div class="activity-icon ${iconClass}">
                        <i class="bi bi-${icon}"></i>
                    </div>
                    <div class="activity-content">
                        <h6>${item.product}</h6>
                        <p class="text-muted mb-1">Code: ${item.code}</p>
                        <small class="text-muted">${date} ${time} • ${item.location} • +${item.points} points</small>
                    </div>
                    <div class="activity-badge">
                        <span class="badge ${badgeClass}">${item.result.charAt(0).toUpperCase() + item.result.slice(1)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    filterHistory(filter) {
        const items = document.querySelectorAll('.history-list .activity-item');
        items.forEach(item => {
            if (filter === 'all' || item.getAttribute('data-filter') === filter) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    updateFilterButtons(activeButton) {
        document.querySelectorAll('[data-filter]').forEach(btn => {
            btn.classList.remove('active');
        });
        activeButton.classList.add('active');
    }
    
    async loadRewardsData() {
        // Rewards data is static in the HTML, but we could load dynamic rewards here
        this.updateRewardAvailability();
    }
    
    updateRewardAvailability() {
        const rewardButtons = document.querySelectorAll('[data-reward]');
        rewardButtons.forEach(btn => {
            const rewardCard = btn.closest('.reward-card');
            const costBadge = rewardCard.querySelector('.badge');
            const cost = parseInt(costBadge.textContent.replace(/\D/g, ''));
            
            if (this.currentUser.points < cost) {
                btn.disabled = true;
                btn.textContent = `Need ${cost - this.currentUser.points} more`;
                btn.classList.remove('btn-success');
                btn.classList.add('btn-outline-secondary');
            } else {
                btn.disabled = false;
                btn.textContent = 'Redeem Now';
                btn.classList.add('btn-success');
                btn.classList.remove('btn-outline-secondary');
            }
        });
    }
    
    async loadProfileData() {
        // Profile data is already loaded with user data
        // Could load additional profile-specific data here
    }
    
    async updateProfile() {
        try {
            this.showLoading('Updating profile...');
            
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            this.hideLoading();
            this.showNotification('Profile updated successfully!', 'success');
        } catch (error) {
            this.hideLoading();
            console.error('Error updating profile:', error);
            this.showNotification('Error updating profile', 'error');
        }
    }
    
    // Chat functionality
    async initializeChat() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/chat/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: this.currentUser?.id || 'anonymous',
                    sessionType: 'support'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.chatSession = data.sessionId;
            }
        } catch (error) {
            console.error('Error initializing chat:', error);
        }
    }
    
    toggleChat() {
        const chatWidget = document.getElementById('chatWidget');
        chatWidget.classList.toggle('active');
    }
    
    closeChat() {
        const chatWidget = document.getElementById('chatWidget');
        chatWidget.classList.remove('active');
    }
    
    async sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message to chat
        this.addChatMessage(message, 'user');
        input.value = '';
        
        try {
            // Send to AI service
            const response = await fetch(`${this.apiBaseUrl}/chat/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: this.chatSession,
                    message: message
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.addChatMessage(data.message, 'ai');
            } else {
                // Fallback response
                this.addChatMessage('I apologize, but I\'m having trouble connecting right now. Please try again later.', 'ai');
            }
        } catch (error) {
            console.error('Error sending chat message:', error);
            this.addChatMessage('I\'m sorry, I\'m experiencing technical difficulties. Please try again later.', 'ai');
        }
    }
    
    addChatMessage(message, sender) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message`;
        
        messageDiv.innerHTML = `
            <div class="message-content">
                ${message}
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    shareResult() {
        if (navigator.share) {
            navigator.share({
                title: 'Verifi AI Verification Result',
                text: 'I just verified a product using Verifi AI!',
                url: window.location.href
            });
        } else {
            // Fallback - copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            this.showNotification('Link copied to clipboard!', 'success');
        }
    }
    
    checkNotifications() {
        // Check for new notifications, rewards, etc.
        // This would typically poll an API or use WebSockets
    }
    
    showLoading(message = 'Loading...') {
        // Create or show loading overlay
        let overlay = document.getElementById('loadingOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="loading-content">
                    <div class="spinner-border text-success" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3">${message}</p>
                </div>
            `;
            document.body.appendChild(overlay);
        } else {
            overlay.querySelector('p').textContent = message;
            overlay.style.display = 'flex';
        }
    }
    
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
    
    showNotification(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'primary'} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        // Add to toast container or create one
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            container.style.zIndex = '1060';
            document.body.appendChild(container);
        }
        
        container.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        // Remove toast element after it's hidden
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.verifiAI = new VerifiAIConsumer();
});

// Add loading overlay styles
const style = document.createElement('style');
style.textContent = `
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }
    
    .loading-content {
        background: white;
        padding: 2rem;
        border-radius: 1rem;
        text-align: center;
        box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.175);
    }
    
    .loading-content p {
        margin: 0;
        color: #6c757d;
    }
`;
document.head.appendChild(style);