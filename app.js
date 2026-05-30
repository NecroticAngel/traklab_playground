document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // SUNRISE & TRACKER ROTATION CONTROLLER
  // ==========================================================================
  const heroSection = document.getElementById('hero');
  const toggleBtn = document.getElementById('sunriseToggleBtn');
  const toggleText = document.getElementById('toggleBtnText');
  const scrollPrompt = document.getElementById('scrollPrompt');
  const trackerSpans = document.querySelectorAll('.tracker-span');

  let sunriseActive = false;

  const triggerSunrise = () => {
    sunriseActive = true;
    heroSection.classList.add('sunrise-active');
    toggleText.textContent = 'Return to Twilight';
  };

  const triggerSunset = () => {
    sunriseActive = false;
    heroSection.classList.remove('sunrise-active');
    toggleText.textContent = 'Trigger Sunrise';
  };

  // Run sunrise automatically after a short delay on load
  setTimeout(() => {
    triggerSunrise();
  }, 600);

  // Toggle sunrise/sunset on button click
  toggleBtn.addEventListener('click', () => {
    if (sunriseActive) {
      triggerSunset();
    } else {
      triggerSunrise();
    }
  });

  // Scroll down when clicking the explore prompt
  scrollPrompt.addEventListener('click', () => {
    const aboutSection = document.getElementById('about');
    aboutSection.scrollIntoView({ behavior: 'smooth' });
  });


  // ==========================================================================
  // HEADER SCROLL TRANSITION
  // ==========================================================================
  const header = document.querySelector('.main-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });


  // ==========================================================================
  // SCROLL-SPY FADE ANIMATION
  // ==========================================================================
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const scrollObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  animatedElements.forEach(el => scrollObserver.observe(el));


  // ==========================================================================
  // INTERACTIVE COMPARATIVE SAVINGS CALCULATOR
  // ==========================================================================
  const monthlyBillInput = document.getElementById('monthlyBill');
  const sunHoursInput = document.getElementById('sunHours');
  
  const monthlyBillVal = document.getElementById('monthlyBillVal');
  const sunHoursVal = document.getElementById('sunHoursVal');

  const monthlySavingsEl = document.getElementById('monthlySavings');
  const lifetimeSavingsEl = document.getElementById('lifetimeSavings');
  const carbonSavingsEl = document.getElementById('carbonSavings');
  const paybackPeriodEl = document.getElementById('paybackPeriod');

  const yieldPremiumBadge = document.getElementById('yieldPremiumBadge');
  const monthlySavingsLabel = document.getElementById('monthlySavingsLabel');
  const lifetimeSavingsLabel = document.getElementById('lifetimeSavingsLabel');

  const btnFixedTilt = document.getElementById('btnFixedTilt');
  const btnTracker = document.getElementById('btnTracker');

  let isTrackerMode = true; // Default to Tracklab single-axis tracker

  const calculateSolarSavings = () => {
    const bill = parseFloat(monthlyBillInput.value);
    const hours = parseFloat(sunHoursInput.value);

    // Update labels
    monthlyBillVal.textContent = `$${bill}`;
    sunHoursVal.textContent = `${hours} hrs`;

    // Base savings ratio for fixed-tilt (60% up to 80% based on sun exposure)
    let savingsPct = Math.min(0.80, 0.50 + (hours - 2) * 0.05);
    
    // Tracklab Tracker Premium: +25% Yield increase
    let yieldMultiplier = 1.0;
    if (isTrackerMode) {
      yieldMultiplier = 1.25;
      savingsPct = Math.min(0.95, savingsPct * yieldMultiplier); // Cap offset at 95%
    }

    const targetMonthlySavings = Math.round(bill * savingsPct);

    // 25-year cumulative savings with 4.5% annual utility inflation
    let targetLifetimeSavings = 0;
    let currentAnnualSavings = targetMonthlySavings * 12;
    for (let year = 1; year <= 25; year++) {
      targetLifetimeSavings += currentAnnualSavings;
      currentAnnualSavings *= 1.045;
    }
    targetLifetimeSavings = Math.round(targetLifetimeSavings);

    // Clean energy generated: roughly 1 MWh per $36 fixed monthly savings
    // Tracker increases energy output directly by 25%
    const targetCarbonSavings = parseFloat(((targetMonthlySavings * 12 * 0.038) * yieldMultiplier).toFixed(1));

    // Payback Period: Upfront system cost estimated at 75x monthly bill.
    // Tracking components add about 15% upfront structure cost.
    // Applying the 30% Federal Investment Tax Credit (ITC)
    const baseSystemCost = bill * 75;
    const systemCost = isTrackerMode ? baseSystemCost * 1.15 : baseSystemCost;
    const netSystemCost = systemCost * 0.70;
    const annualSavings = targetMonthlySavings * 12;
    const targetPaybackPeriod = parseFloat((netSystemCost / annualSavings).toFixed(1));

    // Update comparative labels and badges
    if (isTrackerMode) {
      yieldPremiumBadge.textContent = '+25.0%';
      yieldPremiumBadge.classList.add('accent-text');
      monthlySavingsLabel.textContent = 'Tracker Monthly Savings';
      lifetimeSavingsLabel.textContent = '25-Yr Tracker Savings';
    } else {
      yieldPremiumBadge.textContent = 'Base';
      yieldPremiumBadge.classList.remove('accent-text');
      monthlySavingsLabel.textContent = 'Fixed Monthly Savings';
      lifetimeSavingsLabel.textContent = '25-Yr Fixed Savings';
    }

    // Animate output values to their new targets
    animateNumber(monthlySavings, targetMonthlySavings, '$');
    animateNumber(lifetimeSavings, targetLifetimeSavings, '$', true);
    animateNumber(carbonSavings, targetCarbonSavings, '', false, ' MWh');
    animateNumber(paybackPeriod, targetPaybackPeriod, '', false, ' Years');
  };

  /**
   * Smoothly animates numbers from their current values to target values
   */
  const animateNumber = (element, target, prefix = '', isCurrencyLong = false, suffix = '') => {
    let start = parseFloat(element.innerText.replace(/[^0-9.]/g, '')) || 0;
    const duration = 350; // ms
    const startTime = performance.now();

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out quad
      const easeProgress = progress * (2 - progress);
      const current = start + (target - start) * easeProgress;

      if (isCurrencyLong) {
        element.textContent = `${prefix}${Math.round(current).toLocaleString()}${suffix}`;
      } else if (suffix.includes('MWh') || suffix.includes('Years')) {
        element.textContent = `${prefix}${current.toFixed(1)}${suffix}`;
      } else {
        element.textContent = `${prefix}${Math.round(current)}${suffix}`;
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        if (isCurrencyLong) {
          element.textContent = `${prefix}${target.toLocaleString()}${suffix}`;
        } else {
          element.textContent = `${prefix}${target}${suffix}`;
        }
      }
    };

    requestAnimationFrame(update);
  };

  // Event Listeners for inputs
  monthlyBillInput.addEventListener('input', calculateSolarSavings);
  sunHoursInput.addEventListener('input', calculateSolarSavings);

  // Switcher triggers
  btnFixedTilt.addEventListener('click', () => {
    if (isTrackerMode) {
      isTrackerMode = false;
      btnTracker.classList.remove('active');
      btnFixedTilt.classList.add('active');
      calculateSolarSavings();
    }
  });

  btnTracker.addEventListener('click', () => {
    if (!isTrackerMode) {
      isTrackerMode = true;
      btnFixedTilt.classList.remove('active');
      btnTracker.classList.add('active');
      calculateSolarSavings();
    }
  });

  // Run initial calculation
  calculateSolarSavings();


  // ==========================================================================
  // FORM SUBMISSION & VALIDATION
  // ==========================================================================
  const form = document.getElementById('consultationForm');
  const formSuccess = document.getElementById('formSuccess');
  const submitBtn = form.querySelector('.submit-btn');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Visual button loading state
    submitBtn.querySelector('.btn-text').textContent = 'Analyzing Site Boundary & Backtracking...';
    submitBtn.style.opacity = '0.8';
    submitBtn.style.pointerEvents = 'none';

    // Simulate database/API call
    setTimeout(() => {
      // Hide input rows
      const formRows = form.querySelectorAll('.form-row');
      formRows.forEach(row => row.style.display = 'none');
      submitBtn.style.display = 'none';

      // Reveal success block
      formSuccess.style.display = 'flex';
    }, 1800);
  });
});
