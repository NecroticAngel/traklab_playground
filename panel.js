document.addEventListener('DOMContentLoaded', () => {
  const svg = document.getElementById('sandboxSvg');
  const sunBeam = document.getElementById('sunBeam');
  const detailedTrackerSpan = document.getElementById('detailedTrackerSpan');
  const customCursor = document.getElementById('customCursor');

  // Telemetry HUD Elements
  const sandboxTargetAngle = document.getElementById('sandboxTargetAngle');
  const sandboxTrackerAngle = document.getElementById('sandboxTrackerAngle');
  const sandboxEfficiency = document.getElementById('sandboxEfficiency');
  const sandboxFixedLoss = document.getElementById('sandboxFixedLoss');
  
  const hudLimitBadge = document.getElementById('hudLimitBadge');
  const hudStatusBadge = document.getElementById('hudStatusBadge');
  const sandboxHud = document.getElementById('sandboxHud');

  // SVG Matrix Transform Point (for translating screen mouse X/Y to responsive SVG pixels)
  const pt = svg.createSVGPoint();

  const getSVGCoordinates = (clientX, clientY) => {
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

  // Tracking limits & State Variables
  const LIMIT_DEG = 75;
  let isTracking = true; // Double click toggles this to lock the sun in the sky!
  
  // Last recorded coordinates to lock in place
  let lastSvgX = 720;
  let lastSvgY = 100;
  let lastClientX = 720;
  let lastClientY = 100;

  const handleMouseMove = (e) => {
    // If tracking is locked, do not update coordinate parameters
    if (!isTracking) return;

    const coords = getSVGCoordinates(e.clientX, e.clientY);
    const svgX = coords.x;
    const svgY = coords.y;

    // Cache current positions for locking
    lastSvgX = svgX;
    lastSvgY = svgY;
    lastClientX = e.clientX;
    lastClientY = e.clientY;

    const axleX = 720;
    const axleY = 320;

    // Draw the glowing sunbeam connect line from center axle directly to mouse cursor
    sunBeam.setAttribute('x1', axleX);
    sunBeam.setAttribute('y1', axleY);
    sunBeam.setAttribute('x2', svgX);
    sunBeam.setAttribute('y2', svgY);
    sunBeam.setAttribute('opacity', '0.85');

    // Vector mathematics: Calculate angle between sun beam and vertical zenith axis
    const deltaX = svgX - axleX;
    const deltaY = svgY - axleY; // negative when mouse is above tracker axis

    // Calculate solar angle in radians relative to vertical (straight up = 0 rad, right = positive, left = negative)
    const solarAngleRad = Math.atan2(deltaX, -deltaY);
    const targetAngleDeg = solarAngleRad * (180 / Math.PI);

    // Structural constraint limits (-75 degrees East to +75 degrees West)
    let trackerAngle = Math.max(-LIMIT_DEG, Math.min(LIMIT_DEG, targetAngleDeg));

    // Ground plane horizon check: If mouse cursor goes below the ground line (axleY), force stow mode
    const isBelowHorizon = deltaY > 0;
    if (isBelowHorizon) {
      trackerAngle = 0;
    }

    // Apply rotation transformation to the dynamic panel frame group
    detailedTrackerSpan.style.transition = 'none'; // Instant, lag-free mouse following
    detailedTrackerSpan.style.transform = `rotate(${trackerAngle}deg)`;

    // Calculate efficiencies
    let trackerEfficiency = 100.0;

    if (isBelowHorizon) {
      trackerEfficiency = 0.0;
    } else if (Math.abs(targetAngleDeg) > LIMIT_DEG) {
      const misalignmentDeg = Math.abs(targetAngleDeg) - LIMIT_DEG;
      const misalignmentRad = misalignmentDeg * (Math.PI / 180);
      trackerEfficiency = Math.max(0, Math.cos(misalignmentRad)) * 100;
    }

    // Fixed-tilt efficiency
    const fixedAngleDiffRad = Math.abs(targetAngleDeg) * (Math.PI / 180);
    const fixedEfficiency = isBelowHorizon ? 0.0 : Math.max(0, Math.cos(fixedAngleDiffRad)) * 100;
    const fixedLoss = 100 - fixedEfficiency;

    // Update Telemetry Displays
    sandboxTargetAngle.textContent = isBelowHorizon ? 'Stowed (Night)' : `${targetAngleDeg.toFixed(1)}°`;
    sandboxTrackerAngle.textContent = `${trackerAngle.toFixed(1)}°`;
    sandboxEfficiency.textContent = `${trackerEfficiency.toFixed(1)}%`;
    sandboxFixedLoss.textContent = `${fixedLoss.toFixed(1)}%`;

    // Limit warning HUD overlays
    if (isBelowHorizon) {
      hudLimitBadge.textContent = 'STOWED (NIGHT)';
      hudLimitBadge.style.background = 'rgba(239, 68, 68, 0.15)';
      hudLimitBadge.style.color = '#ef4444';
      hudLimitBadge.style.borderColor = 'rgba(239, 68, 68, 0.4)';
      
      hudStatusBadge.textContent = 'SYSTEM AUTO STOWED';
      hudStatusBadge.style.color = '#ef4444';
      hudStatusBadge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
      hudStatusBadge.style.background = 'rgba(239, 68, 68, 0.08)';
    } else if (Math.abs(targetAngleDeg) > LIMIT_DEG) {
      hudLimitBadge.textContent = 'AXIS LIMIT REACHED';
      hudLimitBadge.style.background = 'rgba(245, 158, 11, 0.15)';
      hudLimitBadge.style.color = '#f59e0b';
      hudLimitBadge.style.borderColor = 'rgba(245, 158, 11, 0.4)';
      
      hudStatusBadge.textContent = 'COSINE LOSS ACTIVE';
      hudStatusBadge.style.color = '#f59e0b';
      hudStatusBadge.style.borderColor = 'rgba(245, 158, 11, 0.3)';
      hudStatusBadge.style.background = 'rgba(245, 158, 11, 0.08)';
    } else {
      hudLimitBadge.textContent = 'OPERATIONAL';
      hudLimitBadge.style.background = 'rgba(74, 222, 128, 0.15)';
      hudLimitBadge.style.color = '#4ade80';
      hudLimitBadge.style.borderColor = 'rgba(74, 222, 128, 0.4)';
      
      hudStatusBadge.textContent = 'ACTIVE MOUSE TRACKING';
      hudStatusBadge.style.color = 'var(--color-accent-gold)';
      hudStatusBadge.style.borderColor = 'rgba(255, 177, 59, 0.3)';
      hudStatusBadge.style.background = 'rgba(255, 177, 59, 0.08)';
    }
  };

  const handleMouseLeave = () => {
    // If position is locked, do not hide sun elements on screen exit
    if (!isTracking) return;

    sunBeam.setAttribute('opacity', '0');
    if (customCursor) {
      customCursor.style.opacity = '0';
    }
  };

  // Add mouse listeners to viewport window
  window.addEventListener('mousemove', (e) => {
    if (!isTracking) return; // Keep cursor locked at last coordinates

    handleMouseMove(e);
    if (customCursor) {
      customCursor.style.left = `${e.clientX}px`;
      customCursor.style.top = `${e.clientY}px`;
      customCursor.style.opacity = '1';
    }
  });

  window.addEventListener('mouseleave', handleMouseLeave);

  // Double Click Handler: Lock / Release Sun position
  window.addEventListener('dblclick', (e) => {
    // Clear double-click browser text highlights
    window.getSelection().removeAllRanges();

    isTracking = !isTracking;
    
    if (isTracking) {
      // Pick up the Sun! Hide default pointer
      document.body.classList.remove('manual-pointer-mode');
      
      if (customCursor) {
        customCursor.style.left = `${e.clientX}px`;
        customCursor.style.top = `${e.clientY}px`;
        customCursor.style.opacity = '1';
      }
      handleMouseMove(e);
    } else {
      // Let go of the Sun! Show default pointer, keep Sun locked at last coordinate
      document.body.classList.add('manual-pointer-mode');
      hudStatusBadge.textContent = 'SUN POSITION LOCKED';
      hudStatusBadge.style.color = 'var(--color-accent-teal)';
      hudStatusBadge.style.borderColor = 'rgba(78, 168, 222, 0.3)';
      hudStatusBadge.style.background = 'rgba(78, 168, 222, 0.08)';
    }
  });

  // Hover animations on clickable elements (makes custom sun cursor glow cyan and scale)
  const interactives = document.querySelectorAll('a, button, input, [role="button"], .custom-slider');
  interactives.forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (customCursor) customCursor.classList.add('cursor-hover');
    });
    el.addEventListener('mouseleave', () => {
      if (customCursor) customCursor.classList.remove('cursor-hover');
    });
  });
});
