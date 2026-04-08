/* ============================================================
   Aquahertz ai — Dashboard Controller
   Handles live data, tab switching, and UI updates
   ============================================================ */

(function () {
  'use strict';

  // ---------- Tab Navigation ----------
  const navItems = document.querySelectorAll('.dash-nav-item');
  const tabPanels = document.querySelectorAll('.tab-panel');

  function switchTab(tabName) {
    tabPanels.forEach(p => p.classList.remove('active'));
    navItems.forEach(n => n.classList.remove('active'));

    const panel = document.getElementById('panel-' + tabName);
    const navItem = document.querySelector(`[data-tab="${tabName}"]`);

    if (panel) panel.classList.add('active');
    if (navItem) navItem.classList.add('active');
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  // ---------- Live Data Polling ----------
  const POLL_INTERVAL = 1500;
  let previousVibration = null;

  function updateConnectionStatus(data) {
    const connDot = document.getElementById('conn-dot');
    const connIcon = document.getElementById('conn-icon');
    const connText = document.getElementById('conn-text');
    const connBadge = document.getElementById('conn-badge');

    if (!connDot) return;

    if (data.device_status === 'Online') {
      connDot.className = 'pulse-dot online';
      connIcon.textContent = 'sensors';
      connText.textContent = 'Connected via USB';
      connText.style.color = 'var(--green-600)';
      if (connBadge) {
        connBadge.className = 'badge badge-success';
        connBadge.textContent = 'Online';
      }
    } else {
      connDot.className = 'pulse-dot offline';
      connIcon.textContent = 'sensors_off';
      connText.textContent = 'Device Offline';
      connText.style.color = 'var(--red-500)';
      if (connBadge) {
        connBadge.className = 'badge badge-danger';
        connBadge.textContent = 'Offline';
      }
    }
  }

  function updateAcousticStatus(data) {
    const statusCard = document.getElementById('status-card');
    const statusIcon = document.getElementById('status-icon');
    const statusTitle = document.getElementById('status-title');
    const statusDesc = document.getElementById('status-desc');
    const statusBadge = document.getElementById('status-badge');

    if (!statusCard) return;

    // Remove all status classes
    statusCard.classList.remove('status-card-normal', 'status-card-warning', 'status-card-critical');

    if (data.status === 'Normal') {
      statusCard.classList.add('status-card-normal');
      if (statusIcon) {
        statusIcon.textContent = 'check_circle';
        statusIcon.style.color = 'var(--green-600)';
        statusIcon.parentElement.style.background = 'var(--green-100)';
      }
      statusTitle.textContent = 'All Systems Normal';
      statusDesc.textContent = 'No acoustic anomalies detected. Pipeline integrity confirmed.';
      if (statusBadge) {
        statusBadge.className = 'badge badge-success';
        statusBadge.innerHTML = '<span class="pulse-dot online" style="width:6px;height:6px"></span> Stable';
      }
    } else if (data.status === 'Critical Leak') {
      statusCard.classList.add('status-card-critical');
      if (statusIcon) {
        statusIcon.textContent = 'error';
        statusIcon.style.color = 'var(--red-600)';
        statusIcon.parentElement.style.background = 'var(--red-100)';
      }
      statusTitle.textContent = 'CRITICAL LEAK DETECTED';
      statusDesc.textContent = 'High-amplitude vibrations detected. Immediate inspection required.';
      if (statusBadge) {
        statusBadge.className = 'badge badge-danger';
        statusBadge.innerHTML = '<span class="pulse-dot offline" style="width:6px;height:6px"></span> Critical';
      }
    } else if (data.status === 'Small Leak') {
      statusCard.classList.add('status-card-warning');
      if (statusIcon) {
        statusIcon.textContent = 'warning';
        statusIcon.style.color = 'var(--amber-600)';
        statusIcon.parentElement.style.background = 'var(--amber-100)';
      }
      statusTitle.textContent = 'Warning: Anomaly Detected';
      statusDesc.textContent = 'Intermittent acoustic irregularities. Recommend pipeline inspection.';
      if (statusBadge) {
        statusBadge.className = 'badge badge-warning';
        statusBadge.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:var(--amber-500);display:inline-block"></span> Warning';
      }
    } else {
      statusTitle.textContent = data.status || 'Initializing...';
      statusDesc.textContent = 'Waiting for sensor data...';
    }
  }

  function updateLiveData(data) {
    const vibValue = document.getElementById('live-vib-value');
    if (vibValue) {
      const newVal = data.vibration;
      if (previousVibration !== newVal) {
        vibValue.style.transition = 'none';
        vibValue.style.transform = 'scale(1.05)';
        vibValue.style.color = 'var(--cyan-400)';
        setTimeout(() => {
          vibValue.style.transition = 'all 0.3s ease';
          vibValue.style.transform = 'scale(1)';
        }, 100);
      }
      vibValue.textContent = newVal;
      previousVibration = newVal;
    }

    // Update vibration bar visual
    const vibBar = document.getElementById('vib-bar');
    if (vibBar) {
      const pct = Math.min((data.vibration / 2000) * 100, 100);
      vibBar.style.width = pct + '%';
      if (pct > 75) {
        vibBar.style.background = 'linear-gradient(90deg, var(--amber-500), var(--red-500))';
      } else if (pct > 40) {
        vibBar.style.background = 'linear-gradient(90deg, var(--cyan-400), var(--amber-500))';
      } else {
        vibBar.style.background = 'linear-gradient(90deg, var(--cyan-400), var(--green-500))';
      }
    }
  }

  function updateProfile(data) {
    const username = document.getElementById('ui-username');
    const subType = document.getElementById('ui-subtype');
    const subDays = document.getElementById('ui-subdays');

    if (username) username.textContent = data.username || 'User';
    if (subType) subType.textContent = data.sub_type || 'Free Plan';
    if (subDays) subDays.textContent = data.sub_days || '--';

    // Update header avatar
    const headerInitial = document.getElementById('header-initial');
    if (headerInitial && data.username) {
      headerInitial.textContent = data.username.charAt(0).toUpperCase();
    }

    const headerUsername = document.getElementById('header-username');
    if (headerUsername) {
      headerUsername.textContent = data.username || 'User';
    }
  }

  function fetchLiveData() {
    fetch('/api/live-data')
      .then(r => {
        if (!r.ok) throw new Error('Unauthorized');
        return r.json();
      })
      .then(data => {
        updateConnectionStatus(data);
        updateAcousticStatus(data);
        updateLiveData(data);
        updateProfile(data);

        // Update last updated timestamp
        const lastUpdated = document.getElementById('last-updated');
        if (lastUpdated) {
          const now = new Date();
          lastUpdated.textContent = 'Last updated: ' + now.toLocaleTimeString();
        }
      })
      .catch(err => {
        console.log('Waiting for backend...', err.message);
      });
  }

  // Start polling
  fetchLiveData();
  setInterval(fetchLiveData, POLL_INTERVAL);

  // ---------- Support Form ----------
  const supportForm = document.getElementById('support-form');
  if (supportForm) {
    supportForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = this.querySelector('button[type="submit"]');
      const origText = btn.textContent;
      btn.textContent = 'Sending...';
      btn.disabled = true;

      setTimeout(() => {
        btn.textContent = '✓ Sent Successfully';
        btn.style.background = 'var(--green-600)';
        setTimeout(() => {
          supportForm.reset();
          btn.textContent = origText;
          btn.style.background = '';
          btn.disabled = false;
        }, 2000);
      }, 800);
    });
  }

  // ---------- Emergency Alert ----------
  const alertBtn = document.getElementById('alert-btn');
  if (alertBtn) {
    alertBtn.addEventListener('click', function () {
      if (confirm('⚠️ This will send a Critical Leak Alert to the central system. Are you sure?')) {
        this.textContent = '🚨 Alert Sent!';
        this.disabled = true;
        this.style.opacity = '0.7';
        setTimeout(() => {
          this.textContent = 'Report Critical Leak';
          this.disabled = false;
          this.style.opacity = '1';
        }, 3000);
      }
    });
  }

})();
