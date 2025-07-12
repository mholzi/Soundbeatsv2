/**
 * Animation utilities and keyframes for Soundbeats UI
 * Provides smooth, engaging animations that enhance the game experience
 */

export const animations = {
  // Basic entrance animations
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,
  
  slideUp: `
    @keyframes slideUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `,
  
  slideDown: `
    @keyframes slideDown {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `,
  
  scaleIn: `
    @keyframes scaleIn {
      from {
        transform: scale(0.8);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }
  `,
  
  // Game-specific animations
  cardReveal: `
    @keyframes cardReveal {
      0% {
        transform: scale(0.8) rotateY(-90deg);
        opacity: 0;
      }
      50% {
        transform: scale(1.05) rotateY(0deg);
        opacity: 0.8;
      }
      100% {
        transform: scale(1) rotateY(0deg);
        opacity: 1;
      }
    }
  `,
  
  scoreIncrease: `
    @keyframes scoreIncrease {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.2);
        color: #4caf50;
      }
      100% {
        transform: scale(1);
      }
    }
  `,
  
  correctAnswer: `
    @keyframes correctAnswer {
      0%, 100% {
        background: rgba(76, 175, 80, 0.2);
        border-color: rgba(76, 175, 80, 0.5);
      }
      50% {
        background: rgba(76, 175, 80, 0.4);
        border-color: rgba(76, 175, 80, 0.8);
        box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
      }
    }
  `,
  
  wrongAnswer: `
    @keyframes wrongAnswer {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }
  `,
  
  // Timer animations
  timerPulse: `
    @keyframes timerPulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.05);
        opacity: 0.8;
      }
    }
  `,
  
  timerWarning: `
    @keyframes timerWarning {
      0%, 100% {
        transform: scale(1);
        color: #ff9800;
      }
      50% {
        transform: scale(1.1);
        color: #f57400;
      }
    }
  `,
  
  timerDanger: `
    @keyframes timerDanger {
      0%, 100% {
        transform: scale(1);
        color: #f44336;
      }
      50% {
        transform: scale(1.2);
        color: #d32f2f;
      }
    }
  `,
  
  // Loading animations
  spin: `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `,
  
  pulse: `
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.5;
        transform: scale(1.05);
      }
    }
  `,
  
  skeleton: `
    @keyframes skeleton {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `,
  
  // Celebration animations
  confetti: `
    @keyframes confetti {
      0% {
        transform: translateY(-100vh) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
      }
    }
  `,
  
  bounce: `
    @keyframes bounce {
      0%, 20%, 53%, 80%, 100% {
        transform: translate3d(0, 0, 0);
      }
      40%, 43% {
        transform: translate3d(0, -30px, 0);
      }
      70% {
        transform: translate3d(0, -15px, 0);
      }
      90% {
        transform: translate3d(0, -4px, 0);
      }
    }
  `,
  
  tada: `
    @keyframes tada {
      0% {
        transform: scale3d(1, 1, 1);
      }
      10%, 20% {
        transform: scale3d(0.9, 0.9, 0.9) rotate3d(0, 0, 1, -3deg);
      }
      30%, 50%, 70%, 90% {
        transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg);
      }
      40%, 60%, 80% {
        transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg);
      }
      100% {
        transform: scale3d(1, 1, 1);
      }
    }
  `,
  
  // Button animations
  buttonPress: `
    @keyframes buttonPress {
      0% { transform: scale(1); }
      50% { transform: scale(0.95); }
      100% { transform: scale(1); }
    }
  `,
  
  buttonHover: `
    @keyframes buttonHover {
      0% { transform: translateY(0) scale(1); }
      100% { transform: translateY(-2px) scale(1.02); }
    }
  `,
  
  // Notification animations
  slideInRight: `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `,
  
  slideOutRight: `
    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `,
};

// Animation utility classes
export const animationClasses = `
  /* Entrance animations */
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }
  
  .animate-slide-up {
    animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  
  .animate-slide-down {
    animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  
  .animate-scale-in {
    animation: scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  
  /* Game animations */
  .animate-card-reveal {
    animation: cardReveal 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  
  .animate-score-increase {
    animation: scoreIncrease 0.6s ease-out;
  }
  
  .animate-correct-answer {
    animation: correctAnswer 1s ease-in-out;
  }
  
  .animate-wrong-answer {
    animation: wrongAnswer 0.5s ease-in-out;
  }
  
  /* Timer animations */
  .animate-timer-pulse {
    animation: timerPulse 2s ease-in-out infinite;
  }
  
  .animate-timer-warning {
    animation: timerWarning 0.5s ease-in-out infinite;
  }
  
  .animate-timer-danger {
    animation: timerDanger 0.3s ease-in-out infinite;
  }
  
  /* Loading animations */
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  .animate-pulse {
    animation: pulse 2s ease-in-out infinite;
  }
  
  .animate-skeleton {
    background: linear-gradient(90deg, 
      rgba(255, 255, 255, 0.1) 25%, 
      rgba(255, 255, 255, 0.2) 50%, 
      rgba(255, 255, 255, 0.1) 75%);
    background-size: 200% 100%;
    animation: skeleton 1.5s infinite;
  }
  
  /* Celebration animations */
  .animate-confetti {
    animation: confetti 3s linear infinite;
  }
  
  .animate-bounce {
    animation: bounce 1s;
  }
  
  .animate-tada {
    animation: tada 1s;
  }
  
  /* Button animations */
  .animate-button-press {
    animation: buttonPress 0.15s ease-out;
  }
  
  .animate-button-hover {
    animation: buttonHover 0.2s ease-out forwards;
  }
  
  /* Notification animations */
  .animate-slide-in-right {
    animation: slideInRight 0.3s ease-out;
  }
  
  .animate-slide-out-right {
    animation: slideOutRight 0.3s ease-out;
  }
  
  /* Animation states */
  .animate-paused {
    animation-play-state: paused;
  }
  
  .animate-running {
    animation-play-state: running;
  }
  
  /* Animation delays */
  .animate-delay-100 {
    animation-delay: 100ms;
  }
  
  .animate-delay-200 {
    animation-delay: 200ms;
  }
  
  .animate-delay-300 {
    animation-delay: 300ms;
  }
  
  .animate-delay-500 {
    animation-delay: 500ms;
  }
  
  /* Animation durations */
  .animate-fast {
    animation-duration: 150ms;
  }
  
  .animate-normal {
    animation-duration: 300ms;
  }
  
  .animate-slow {
    animation-duration: 500ms;
  }
  
  .animate-slower {
    animation-duration: 1s;
  }
`;

// Utility functions for dynamic animations
export const animationUtils = {
  // Apply entrance animation to element
  applyEntranceAnimation: (element, animationType = 'fadeIn', delay = 0) => {
    if (!element) return;
    
    element.style.animationDelay = `${delay}ms`;
    element.classList.add(`animate-${animationType}`);
    
    // Remove animation class after completion
    element.addEventListener('animationend', () => {
      element.classList.remove(`animate-${animationType}`);
    }, { once: true });
  },
  
  // Trigger celebration animation
  triggerCelebration: (element, type = 'tada') => {
    if (!element) return;
    
    element.classList.add(`animate-${type}`);
    
    element.addEventListener('animationend', () => {
      element.classList.remove(`animate-${type}`);
    }, { once: true });
  },
  
  // Stagger animations for multiple elements
  staggerAnimations: (elements, animationType = 'fadeIn', staggerDelay = 100) => {
    elements.forEach((element, index) => {
      animationUtils.applyEntranceAnimation(element, animationType, index * staggerDelay);
    });
  },
  
  // Create confetti effect
  createConfetti: (container, count = 20) => {
    for (let i = 0; i < count; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti animate-confetti';
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.animationDelay = `${Math.random() * 3}s`;
      confetti.style.backgroundColor = getRandomColor();
      container.appendChild(confetti);
      
      // Remove after animation
      setTimeout(() => {
        confetti.remove();
      }, 3000);
    }
  },
  
  // Get random confetti color
  getRandomColor: () => {
    const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
    return colors[Math.floor(Math.random() * colors.length)];
  },
};

// Export all animations as CSS string
export const allAnimations = Object.values(animations).join('\n') + '\n' + animationClasses;

export default animations;