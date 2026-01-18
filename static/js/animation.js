// === Text wave animation ===

const { animate, splitText, createTimeline } = window.anime || {};
if (!animate || !splitText || !createTimeline) {
  throw new Error("anime.js v4 UMD not loaded");
}

// === Shared helpers/constants ===
const randomBetween = (min, max) => Math.random() * (max - min) + min;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const legendaryPulseIds = new Set([
  'j-yorick',
  'j-canio',
  'j-triboulet',
  'j-chicot',
  'j-perkeo',
  'j-hologram',
]);

// 1. Разбиваем текст на слова
const { words } = splitText('#title', {
  words: { wrap: 'span' },
});

// 2. Создаём общий timeline
const timeline = createTimeline({
  loop: true, // цикл ТОЛЬКО после завершения всех слов
});

// Общие настройки
const letterDelay = 250;
const duration = 1000;

// 3. Добавляем каждое слово в timeline
words.forEach(word => {
  // Разбиваем слово на буквы
  const { chars } = splitText(word, {
    chars: { wrap: 'clip' },
  });

  // Добавляем анимацию слова
  timeline.add(
    chars,
    {
      y: [
        { to: ['0', '-0.25rem'] },
        { to: ['-0.25rem', '0'], ease: 'in(4)' }
      ],
      duration,
      ease: 'out(2)',

      // волна ВНУТРИ слова
      delay: (el, i) => i * letterDelay,
    },
    0 // ⬅️ ВСЕ слова стартуют одновременно
  );
});


// === Joker parallax + hover/tilt ===
const jokerSelector = '[data-joker-id]';

const getJokerTarget = (joker) => joker.closest('.card-wrapper') || joker;

// === Parallax shadows for visible cards ===
const parallaxTargets = new Set();
const parallaxObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const cell = entry.target.closest('.card-cell') || entry.target;
    if (entry.isIntersecting) {
      parallaxTargets.add(cell);
      return;
    }

    parallaxTargets.delete(cell);
    cell.style.setProperty('--parallax-shadow-x', '0px');
    cell.style.setProperty('--parallax-shadow-y', '0px');
    cell.style.setProperty('--parallax-shadow-blur', '0px');
    const innerCard = cell.querySelector('.card');
    if (innerCard) {
      innerCard.style.setProperty('--parallax-shadow-x', '0px');
      innerCard.style.setProperty('--parallax-shadow-y', '0px');
      innerCard.style.setProperty('--parallax-shadow-blur', '0px');
      innerCard.style.setProperty('--yorick-offset-x', '0px');
      innerCard.style.setProperty('--yorick-offset-y', '0px');
    }
  });
}, { threshold: 0.1 });

const updateParallaxShadows = () => {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const maxOffset = 12;

  parallaxTargets.forEach((card) => {
    if (!card.isConnected) {
      parallaxTargets.delete(card);
      return;
    }

    const rect = card.getBoundingClientRect();
    const cardX = rect.left + rect.width / 2;
    const cardY = rect.top + rect.height / 2;
    const dx = clamp((cardX - centerX) / centerX, -1, 1);
    const dy = clamp((cardY - centerY) / centerY, -1, 1);
    const shadowX = -dx * maxOffset;
    const shadowY = -dy * maxOffset;

    card.style.setProperty('--parallax-shadow-x', `${shadowX.toFixed(2)}px`);
    card.style.setProperty('--parallax-shadow-y', `${shadowY.toFixed(2)}px`);
    const innerCard = card.querySelector('.card');
    if (innerCard) {
      innerCard.style.setProperty('--parallax-shadow-x', `${shadowX.toFixed(2)}px`);
      innerCard.style.setProperty('--parallax-shadow-y', `${shadowY.toFixed(2)}px`);
      if (innerCard.id === 'j-yorick') {
        const yorickX = shadowX * 0.6;
        const yorickY = shadowY * 0.6;
        innerCard.style.setProperty('--yorick-offset-x', `${yorickX.toFixed(2)}px`);
        innerCard.style.setProperty('--yorick-offset-y', `${yorickY.toFixed(2)}px`);
      }
    }
  });

  requestAnimationFrame(updateParallaxShadows);
};

requestAnimationFrame(updateParallaxShadows);

// === Idle tilts + legendary pulses ===
const startJokerTilts = (joker) => {
  const target = getJokerTarget(joker);
  if (target.dataset.jokerTilt === "true") {
    return;
  }
  target.dataset.jokerTilt = "true";

  const side = randomBetween(-0.99, 1)

  const startAngle = side > 0 ? randomBetween(0.5, 0.75) : randomBetween(-0.75, -0.25);
  const endAngle = side < 0 ? randomBetween(0.5, 0.75) : randomBetween(-0.75, -0.25);

  animate(target, {
    rotateZ: [startAngle, endAngle],
    duration: randomBetween(2000, 3000),
    duration: 2500,
    ease: 'inOut(2)',
    loop: true,
    alternate: true,
  });
};

// === Legendary pulse animations ===
const startLegendaryPulse = (joker) => {
  const innerCard = joker.querySelector('.card') || joker;
  if (!innerCard || !legendaryPulseIds.has(innerCard.id)) {
    return;
  }
  if (innerCard.dataset.legendaryPulse === "true") {
    return;
  }
  innerCard.dataset.legendaryPulse = "true";

  animate(innerCard, {
    '--legendary-pulse': [1, 1.05],
    duration: 1500,
    ease: 'inOut(2)',
    loop: true,
    alternate: true,
  });

  animate(innerCard, {
    '--legendary-tilt': ['-3deg', '3deg'],
    duration: 2500,
    ease: 'inOut(2)',
    loop: true,
    alternate: true,
  });
};

// === Initialization helpers ===
const observeJoker = (joker, tiltObserver = null) => {
  const target = getJokerTarget(joker);
  if (tiltObserver) {
    tiltObserver.observe(target);
  } else {
    startJokerTilts(target);
  }
  startLegendaryPulse(target);
  parallaxObserver.observe(target);
};

const initJokerTilts = (root = document, tiltObserver = null) => {
  root.querySelectorAll(jokerSelector).forEach((joker) => {
    observeJoker(joker, tiltObserver);
  });
};

// === Sidebar/card drift animation ===
const sidebarWrapper = document.querySelector('#sidebar-wrapper');
const sidebar = document.querySelector('#sidebar');
const cardWrap = document.querySelector('#card-grid-wrapper');
if (sidebarWrapper) {
  const maxX = 4;
  const maxY = 4;
  const minDuration = 4000;
  const maxDuration = 5000;

  const animateDrift = () => {
    const targetX = randomBetween(-maxX, maxX);
    const targetY = randomBetween(-maxY, maxY);
    const duration = randomBetween(minDuration, maxDuration);

    animate([sidebarWrapper, cardWrap], {
      x: targetX,
      duration,
      ease: 'inOut(2)',
      onComplete: animateDrift,
    });
    animate([sidebar,cardWrap], {
      y: targetY,
      duration,
      ease: 'inOut(2)',
      onComplete: animateDrift,
    });
  };

  animateDrift();
}

// === Lazy tilt init for visible cards ===
const cardContainer = document.querySelector('#card-grid');
const tiltRoot = cardContainer || document;
const tiltObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) {
      return;
    }

    startJokerTilts(entry.target);
    tiltObserver.unobserve(entry.target);
  });
}, { threshold: 0.1 });

initJokerTilts(tiltRoot, tiltObserver);

// === Observe dynamically added cards ===
if (cardContainer) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (!node || node.nodeType !== 1) {
          return;
        }

        if (node.matches(jokerSelector)) {
          observeJoker(node, tiltObserver);
          return;
        }

        if (node.querySelectorAll) {
          initJokerTilts(node, tiltObserver);
        }
      });
    });
  });

  observer.observe(cardContainer, { childList: true, subtree: true });
}
