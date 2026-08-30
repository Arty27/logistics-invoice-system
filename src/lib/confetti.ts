import confetti from 'canvas-confetti';

export const launchConfetti = () => {
  const duration = 2 * 1000;
  const end = Date.now() + duration;

  const colors = ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8'];

  const frame = () => {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });

    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
};
