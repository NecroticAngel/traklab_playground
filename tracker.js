document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const sun = document.getElementById('sun');
  const skyNight = document.getElementById('skyNight');
  const skyDawn = document.getElementById('skyDawn');
  const skyDay = document.getElementById('skyDay');
  const trackerSpans = document.querySelectorAll('.tracker-span');

  const timeSlider = document.getElementById('timeSlider');
  const timeSliderVal = document.getElementById('timeSliderVal');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const autoPlayToggleBtn = document.getElementById('autoPlayToggleBtn');

  // Telemetry Elements
  const hudSunElevation = document.getElementById('hudSunElevation');
  const hudTrackerAngle = document.getElementById('hudTrackerAngle');
  const hudActiveEfficiency = document.getElementById('hudActiveEfficiency');
  const hudFixedEfficiency = document.getElementById('hudFixedEfficiency');
  const hudPremiumGain = document.getElementById('hudPremiumGain');
  const hudComparisonFill = document.getElementById('hudComparisonFill');

  let isPlaying = false;
  let animationFrameId = null;

  // Format minutes into a nice 12-hour AM/PM string
  const formatTime = (totalMinutes) => {
    let hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  // Main Update Simulation Math function (updates 60 times a second on slider slide or auto loop)
  const updateSimulation = () => {
    const timeVal = parseInt(timeSlider.value, 10);
    
    // Update Slider Time label
    timeSliderVal.textContent = formatTime(timeVal);

    // 1. Calculate Normalized Time (value from 0 at 6:00 AM to 1 at 6:00 PM)
    const normalizedTime = (timeVal - 360) / 720;
    const elevationRad = normalizedTime * Math.PI;

    // 2. Calculate Sun Trajectory (Y elevation uses sine, X translation uses linear sweep)
    const sunX = normalizedTime * 100; // sweeps from 0% left to 100% right
    const sunElevationDeg = Math.sin(elevationRad) * 90; // Peaks at 90 degrees at noon
    const sunY = 75 - (Math.sin(elevationRad) * 58); // Sun vertical height (20% top down to 80%)

    // Apply Y & X positions directly to Sun element
    sun.style.left = `${sunX}%`;
    sun.style.top = `${sunY}%`;

    // 3. Compute Sky Opacities (Fluid real-time crossfading)
    const sinVal = Math.sin(elevationRad);
    
    // Day sky (bright blue) is active during peak sunlight hours
    const opacityDay = Math.max(0, (sinVal - 0.2) / 0.8);
    // Dawn/Sunset sky (rich crimson) is active when sun is near horizon (morning/evening)
    const opacityDawn = sinVal > 0 ? (1 - Math.abs(sinVal - 0.25) / 0.75) : 0;
    // Night sky (deep starry indigo) is active when sun is at the horizon/night
    const opacityNight = 1 - sinVal;

    skyDay.style.opacity = opacityDay;
    skyDawn.style.opacity = opacityDawn;
    skyNight.style.opacity = opacityNight;

    // 4. Calculate Tracker Alignment (Pivots from -60 degrees at dawn to +60 degrees at dusk)
    const trackerAngle = (normalizedTime * 120) - 60; // linear tracking angle
    
    // Apply rotate transform to all tracker groups in the SVG horizon
    trackerSpans.forEach(span => {
      // Overriding standard class transitions to support instantaneous, lag-free 60fps rendering
      span.style.transition = 'none';
      span.style.transform = `rotate(${trackerAngle}deg)`;
    });

    // 5. Calculate Solar Efficiencies (Trigonometric Cosine Loss model)
    // A single-axis tracker is always perpendicular to the sun, so it has 100% cosine absorption
    const trackerEfficiency = 100.0;
    
    // Fixed-tilt panel sits at a static South-facing 30 degree tilt (modeled at angle = 0 relative to solar zenith)
    // Efficiency = cos(theta) where theta is the misalignment angle
    const angleDifferenceRad = Math.abs(trackerAngle) * (Math.PI / 180);
    const fixedEfficiency = Math.max(0, Math.cos(angleDifferenceRad)) * 100;
    
    // Yield Premium gained by using the active tracker over fixed mount
    const yieldGain = trackerEfficiency - fixedEfficiency;

    // 6. Update Telemetry HUD readouts
    hudSunElevation.textContent = `${sunElevationDeg.toFixed(1)}°`;
    hudTrackerAngle.textContent = `${trackerAngle.toFixed(1)}°`;
    hudActiveEfficiency.textContent = `${trackerEfficiency.toFixed(1)}%`;
    hudFixedEfficiency.textContent = `${fixedEfficiency.toFixed(1)}%`;

    hudPremiumGain.textContent = `+${yieldGain.toFixed(1)}% Yield Premium`;
    hudComparisonFill.style.width = `${yieldGain}%`;
  };

  // Autoplay clock loop
  const startAutoplay = () => {
    let currentVal = parseInt(timeSlider.value, 10);
    currentVal += 2; // Increments clock by 2 minutes per frame for high-speed dynamic sweep
    
    if (currentVal > 1080) {
      currentVal = 360; // loops back to 6:00 AM
    }
    
    timeSlider.value = currentVal;
    updateSimulation();
    
    if (isPlaying) {
      animationFrameId = requestAnimationFrame(startAutoplay);
    }
  };

  // Toggle Autoplay State
  const togglePlay = () => {
    isPlaying = !isPlaying;
    if (isPlaying) {
      playPauseBtn.classList.add('active');
      playPauseBtn.querySelector('.play-icon').textContent = '⏸';
      playPauseBtn.querySelector('.play-text').textContent = 'Pause Lab';
      autoPlayToggleBtn.textContent = 'Auto-Cycle: On';
      autoPlayToggleBtn.style.background = 'rgba(78, 168, 222, 0.2)';
      startAutoplay();
    } else {
      playPauseBtn.classList.remove('active');
      playPauseBtn.querySelector('.play-icon').textContent = '▶';
      playPauseBtn.querySelector('.play-text').textContent = 'Auto Loop';
      autoPlayToggleBtn.textContent = 'Auto-Cycle: Off';
      autoPlayToggleBtn.style.background = 'linear-gradient(135deg, rgba(255,177,59,0.1), rgba(255,177,59,0.25))';
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    }
  };

  // Listen to input sliders
  timeSlider.addEventListener('input', () => {
    // If playing, pause auto-play on manual drag to avoid slider jumping conflicts
    if (isPlaying) {
      togglePlay();
    }
    updateSimulation();
  });

  // Buttons triggers
  playPauseBtn.addEventListener('click', togglePlay);
  autoPlayToggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    togglePlay();
  });

  // Run initial simulation update on load
  updateSimulation();
});
