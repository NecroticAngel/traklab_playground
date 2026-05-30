document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const replayBtn = document.getElementById('replayBtn');

  // Trigger sunrise cinematic sequence automatically after a tiny render settling delay
  const playSunriseReveal = () => {
    setTimeout(() => {
      body.classList.add('sun-rising');
    }, 300);
  };

  // Replay intro sequence handler
  const resetAndReplay = () => {
    // 1. Remove classes to instantly return everything to solid blue / stowed state
    body.classList.remove('sun-rising');
    
    // 2. Allow transition frames to clear, then trigger the sequence again
    setTimeout(() => {
      playSunriseReveal();
    }, 150);
  };

  // Attach button triggers
  replayBtn.addEventListener('click', resetAndReplay);

  // Play immediately on load
  playSunriseReveal();
});
