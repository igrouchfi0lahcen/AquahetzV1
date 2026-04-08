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

  // Simulated cumulative states for the demo
  let totalLitersSaved = 24500;
  let totalCostSaved = 8350;
  let totalLeaksPrevented = 124;
  let alertsHistory = [
    { time: '10:42 PM', zone: 'Zone 2', type: 'Pressure Drop', status: 'Resolved', severity: 'Info', confidence: '90%', urgency: 'None', action: 'System stabilized' },
    { time: 'Yesterday', zone: 'Zone 4', type: 'Micro-leak', status: 'Inspecting', severity: 'Warning', confidence: '45%', urgency: '< 48 Hours', action: 'Visual inspection pending' },
  ];
  let lastStatus = null;

  function updateDeepTechUI(data) {
    const riskStatus = document.getElementById('dt-risk-status');
    const happenedVal = document.getElementById('dt-happened-val');
    const urgencyVal = document.getElementById('dt-urgency-val');
    const actionVal = document.getElementById('dt-action-val');
    const waterValue = document.getElementById('dt-water-value');
    const costValue = document.getElementById('dt-cost-value');
    
    const blockHappened = document.getElementById('block-happened');
    const blockUrgency = document.getElementById('block-urgency');
    const blockAction = document.getElementById('block-action');
    const blockValue = document.getElementById('block-value');
    const headerBg = document.getElementById('dt-incident-header-bg');
    
    const pipeZone1 = document.getElementById('pipe-zone-1');
    const pipeZone2 = document.getElementById('pipe-zone-2');
    const pipeZone3 = document.getElementById('pipe-zone-3');
    const pipeZone4 = document.getElementById('pipe-zone-4');

    const alertsBody = document.getElementById('dt-alerts-body');
    const tablePulse = document.getElementById('table-pulse');

    // Incremental bump
    totalLitersSaved += (Math.random() * 5);
    totalCostSaved += (Math.random() * 2);
    if (Math.random() > 0.95) totalLeaksPrevented += 1;
    let ecoScore = (totalLitersSaved * 0.000293).toFixed(2);

    if (waterValue) waterValue.textContent = Math.floor(totalLitersSaved).toLocaleString();
    if (costValue) costValue.textContent = Math.floor(totalCostSaved).toLocaleString();

    // Impact Dashboard Integrations
    const impactWater = document.getElementById('impact-water-value');
    const impactCost = document.getElementById('impact-cost-value');
    const impactLeaks = document.getElementById('impact-leaks-value');
    const impactEco = document.getElementById('impact-eco-value');

    if (impactWater) impactWater.textContent = Math.floor(totalLitersSaved).toLocaleString();
    if (impactCost) impactCost.textContent = Math.floor(totalCostSaved).toLocaleString();
    if (impactLeaks) impactLeaks.textContent = totalLeaksPrevented;
    if (impactEco) impactEco.textContent = ecoScore;

    // Mapping states based on data.status
    if (data.status === 'Critical Leak') {
      if (headerBg) headerBg.className = 'dt-incident-header critical';
      if (blockHappened) blockHappened.className = 'dt-incident-block critical';
      if (blockUrgency) blockUrgency.className = 'dt-incident-block critical';
      if (blockAction) blockAction.className = 'dt-incident-block critical';
      if (blockValue) blockValue.className = 'dt-incident-block critical';
      
      if (pipeZone1) pipeZone1.setAttribute('class', 'map-pipe');
      if (pipeZone2) pipeZone2.setAttribute('class', 'map-pipe');
      if (pipeZone3) pipeZone3.setAttribute('class', 'map-pipe');
      if (pipeZone4) pipeZone4.setAttribute('class', 'map-pipe critical');

      if (riskStatus) { 
        riskStatus.className = 'dt-status critical'; 
        riskStatus.setAttribute('data-i18n', 'dash.risk.critical');
        if (window.AquaI18n) riskStatus.textContent = window.AquaI18n.t('dash.risk.critical');
      }
      if (happenedVal) { 
        happenedVal.setAttribute('data-i18n', 'dash.val.happened.critical');
        happenedVal.textContent = window.AquaI18n ? window.AquaI18n.t('dash.val.happened.critical') : 'Critical: Huge pressure drop detected in Zone 4.'; 
      }
      if (urgencyVal) { 
        urgencyVal.setAttribute('data-i18n', 'dash.urgency.immediate');
        urgencyVal.textContent = window.AquaI18n ? window.AquaI18n.t('dash.urgency.immediate') : 'Immediate Alert — < 12 Hours to failure.'; 
        urgencyVal.style.color = '#F87171';
      }
      if (actionVal) { 
        actionVal.setAttribute('data-i18n', 'dash.action.shutdown');
        actionVal.textContent = window.AquaI18n ? window.AquaI18n.t('dash.action.shutdown') : 'Initiate emergency shutdown sequence to prevent burst.'; 
      }
      if (waterValue) waterValue.style.color = '#F87171';
      
      // Add to alerts if status just changed to critical
      if (lastStatus !== 'Critical Leak') {
        const now = new Date();
        alertsHistory.unshift({ 
          time: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
          zone: 'Zone 4', 
          type: 'Critical Leak', 
          status: 'Active',
          severity: 'Critical',
          confidence: '94%',
          urgency: 'Immediate',
          action: 'Emergency Shutdown'
        });
        if (alertsHistory.length > 8) alertsHistory.pop();
        if (tablePulse) tablePulse.style.background = '#F87171';
      }
    } else if (data.status === 'Small Leak') {
      if (headerBg) headerBg.className = 'dt-incident-header warning';
      if (blockHappened) blockHappened.className = 'dt-incident-block warning';
      if (blockUrgency) blockUrgency.className = 'dt-incident-block warning';
      if (blockAction) blockAction.className = 'dt-incident-block warning';
      if (blockValue) blockValue.className = 'dt-incident-block warning';

      if (pipeZone1) pipeZone1.setAttribute('class', 'map-pipe');
      if (pipeZone2) pipeZone2.setAttribute('class', 'map-pipe warning');
      if (pipeZone3) pipeZone3.setAttribute('class', 'map-pipe');
      if (pipeZone4) pipeZone4.setAttribute('class', 'map-pipe');

      if (riskStatus) { 
        riskStatus.className = 'dt-status medium'; 
        riskStatus.setAttribute('data-i18n', 'dash.risk.medium');
        if (window.AquaI18n) riskStatus.textContent = window.AquaI18n.t('dash.risk.medium');
      }
      if (happenedVal) { 
        happenedVal.setAttribute('data-i18n', 'dash.val.happened.warning');
        happenedVal.textContent = window.AquaI18n ? window.AquaI18n.t('dash.val.happened.warning') : 'Warning: Micro-leak acoustic signature matched in Zone 2.'; 
      }
      if (urgencyVal) { 
        urgencyVal.setAttribute('data-i18n', 'dash.urgency.soon');
        urgencyVal.textContent = window.AquaI18n ? window.AquaI18n.t('dash.urgency.soon') : 'Moderate — Escalate within 48 Hours.'; 
        urgencyVal.style.color = '#FBBF24';
      }
      if (actionVal) { 
        actionVal.setAttribute('data-i18n', 'dash.action.inspect');
        actionVal.textContent = window.AquaI18n ? window.AquaI18n.t('dash.action.inspect') : 'Dispatch field team for visual assessment.'; 
      }
      if (waterValue) waterValue.style.color = '#FBBF24';
      
      if (lastStatus !== 'Small Leak' && lastStatus !== 'Critical Leak') {
        const now = new Date();
        alertsHistory.unshift({ 
          time: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
          zone: 'Zone 2', 
          type: 'Micro-leak', 
          status: 'Pending',
          severity: 'Warning',
          confidence: '48%',
          urgency: '< 48 Hours',
          action: 'Dispatch Team'
        });
        if (alertsHistory.length > 8) alertsHistory.pop();
        if (tablePulse) tablePulse.style.background = '#FBBF24';
      }
    } else {
      // Normal
      if (headerBg) headerBg.className = 'dt-incident-header';
      if (blockHappened) blockHappened.className = 'dt-incident-block';
      if (blockUrgency) blockUrgency.className = 'dt-incident-block';
      if (blockAction) blockAction.className = 'dt-incident-block';
      if (blockValue) blockValue.className = 'dt-incident-block';

      if (pipeZone1) pipeZone1.setAttribute('class', 'map-pipe');
      if (pipeZone2) pipeZone2.setAttribute('class', 'map-pipe');
      if (pipeZone3) pipeZone3.setAttribute('class', 'map-pipe');
      if (pipeZone4) pipeZone4.setAttribute('class', 'map-pipe');

      if (riskStatus) { 
        riskStatus.className = 'dt-status low'; 
        riskStatus.setAttribute('data-i18n', 'dash.risk.low');
        if (window.AquaI18n) riskStatus.textContent = window.AquaI18n.t('dash.risk.low');
      }
      if (happenedVal) { 
        happenedVal.setAttribute('data-i18n', 'dash.val.happened.normal');
        happenedVal.textContent = window.AquaI18n ? window.AquaI18n.t('dash.val.happened.normal') : 'All infrastructure zones stable. No anomalies detected.'; 
      }
      if (urgencyVal) { 
        urgencyVal.setAttribute('data-i18n', 'dash.val.urgency.normal');
        urgencyVal.textContent = window.AquaI18n ? window.AquaI18n.t('dash.val.urgency.normal') : 'Optimal — No immediate action required.'; 
        urgencyVal.style.color = 'var(--text-main)';
      }
      if (actionVal) { 
        actionVal.setAttribute('data-i18n', 'dash.val.action.normal');
        actionVal.textContent = window.AquaI18n ? window.AquaI18n.t('dash.val.action.normal') : 'Continue standard active monitoring protocol.'; 
      }
      if (waterValue) waterValue.style.color = 'var(--cyan-bright)';

      if (tablePulse) tablePulse.style.background = '#34D399';
    }

    lastStatus = data.status;

    // Render table
    if (alertsBody) {
      alertsBody.innerHTML = '';
      alertsHistory.slice(0, 4).forEach(alert => {
        let statusColor = alert.status === 'Active' ? '#F87171' : (alert.status === 'Pending' ? '#FBBF24' : '#34D399');
        alertsBody.innerHTML += `
          <tr>
            <td>${alert.time}</td>
            <td>${alert.zone}</td>
            <td style="color:var(--text-main);font-weight:500">${alert.type}</td>
            <td><span style="display:inline-block;padding:0.25rem 0.625rem;border-radius:12px;font-size:0.75rem;font-weight:600;color:${statusColor};background:${statusColor}22">${alert.status}</span></td>
          </tr>
        `;
      });
    }

    const hubAlertsBody = document.getElementById('dt-hub-alerts-body');
    if (hubAlertsBody && alertsHistory.length > 0) {
      hubAlertsBody.innerHTML = '';
      alertsHistory.forEach(alert => {
        let sc = alert.severity === 'Critical' ? '#F87171' : (alert.severity === 'Warning' ? '#FBBF24' : '#34D399');
        let sevBadge = `<span style="display:inline-block;padding:0.25rem 0.625rem;border-radius:12px;font-size:0.75rem;font-weight:600;color:${sc};background:${sc}22">${alert.severity}</span>`;
        if (alert.severity === 'Info') {
            sc = '#34D399';
            sevBadge = `<span style="display:inline-block;padding:0.25rem 0.625rem;border-radius:12px;font-size:0.75rem;font-weight:600;color:${sc};background:${sc}22">Resolved</span>`;
        }
        
        let confBar = `<div style="display:flex;align-items:center;gap:0.5rem;"><div style="width:50px;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;"><div style="width:${alert.confidence};height:100%;background:${sc};"></div></div><span style="font-size:0.8125rem">${alert.confidence}</span></div>`;

        hubAlertsBody.innerHTML += `
          <tr>
            <td style="white-space:nowrap;font-size:0.875rem;">${alert.time}</td>
            <td>${sevBadge}</td>
            <td style="color:var(--text-main);font-weight:500;font-size:0.875rem;">${alert.zone} - ${alert.type}</td>
            <td>${confBar}</td>
            <td style="color:${sc};font-weight:600;font-size:0.875rem;">${alert.urgency}</td>
            <td style="color:var(--text-muted);font-size:0.875rem;">${alert.action}</td>
          </tr>
        `;
      });
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

  // ---------- Demo Mode Simulator ----------
  let demoModeEnabled = false;
  let demoTick = 0;
  let demoScenarioIndex = 0;
  const demoScenarios = ['Normal', 'Small Leak', 'Critical Leak'];

  const demoToggle = document.getElementById('demo-mode-toggle');
  const demoLabel = document.getElementById('demo-mode-label');
  if (demoToggle) {
    demoToggle.addEventListener('change', (e) => {
      demoModeEnabled = e.target.checked;
      if (demoModeEnabled) {
         demoScenarioIndex = 0;
         demoTick = 0;
         if (demoLabel) demoLabel.style.color = 'var(--cyan-bright)';
      } else {
         if (demoLabel) demoLabel.style.color = 'var(--text-muted)';
      }
    });
  }

  function fetchLiveData() {
    if (demoModeEnabled) {
      demoTick++;
      // Every ~7.5 seconds (POLL_INTERVAL=1500, so 5 ticks) cycle to next scenario
      if (demoTick > 5) {
          demoTick = 0;
          demoScenarioIndex = (demoScenarioIndex + 1) % 3;
      }
      
      const mockData = {
          vibration: Math.floor(Math.random() * 50) + (demoScenarioIndex === 2 ? 800 : 0),
          status: demoScenarios[demoScenarioIndex],
          device_status: 'Online',
          sub_days: 365,
          sub_type: 'Enterprise Demo',
          username: 'Demo Operator'
      };
      
      updateConnectionStatus(mockData);
      updateDeepTechUI(mockData);
      updateProfile(mockData);

      const lastUpdated = document.getElementById('last-updated');
      if (lastUpdated) {
        const now = new Date();
        lastUpdated.textContent = 'Last updated: ' + now.toLocaleTimeString() + ' (DEMO)';
      }
      return; // Skip actual fetch
    }

    fetch('/api/live-data')
      .then(r => {
        if (!r.ok) throw new Error('Unauthorized');
        return r.json();
      })
      .then(data => {
        updateConnectionStatus(data);
        updateDeepTechUI(data);
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
        const connDot = document.getElementById('conn-dot');
        const connIcon = document.getElementById('conn-icon');
        const connText = document.getElementById('conn-text');
        
        if (connText) {
          connText.textContent = 'Connection Error: ' + err.message;
          connText.style.color = 'var(--red-500)';
        }
        if (connDot) connDot.className = 'pulse-dot offline';
        if (connIcon) connIcon.textContent = 'sensors_off';
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
