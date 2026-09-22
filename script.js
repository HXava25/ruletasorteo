const canvas = document.getElementById('wheelCanvas');
const context = canvas.getContext('2d');
const itemsInput = document.getElementById('itemsInput');
const spinButton = document.getElementById('spinButton');
const overlaySpin = document.getElementById('overlaySpin');
const resetButton = document.getElementById('resetButton');
const editButton = document.getElementById('editButton');
const hideButton = document.getElementById('hideButton');
const titleButton = document.getElementById('titleButton');
const resultBanner = document.getElementById('resultBanner');
const resultText = document.getElementById('resultText');
const closeBanner = document.getElementById('closeBanner');

const colors = ['#4169df', '#fa7b72', '#91f28d', '#f6dfad', '#d799d8'];
const initialItems = itemsInput.value.split('\n');
let items = [...initialItems];
let rotation = 0;
let spinning = false;
let bannerTimer;
let winningItem = null;

function getItems() {
  const values = itemsInput.value.split('\n').map((item) => item.trim()).filter(Boolean);
  return values.length ? values : [' '];
}

function drawWheel() {
  const size = canvas.width;
  const center = size / 2;
  const radius = center - 4;
  const slice = (Math.PI * 2) / items.length;

  context.clearRect(0, 0, size, size);
  context.save();
  context.translate(center, center);
  context.rotate(rotation);
  context.translate(-center, -center);

  items.forEach((item, index) => {
    const start = index * slice - Math.PI / 2;
    const end = start + slice;
    context.beginPath();
    context.moveTo(center, center);
    context.arc(center, center, radius, start, end);
    context.closePath();
    context.fillStyle = colors[index % colors.length];
    context.fill();
    context.strokeStyle = 'rgba(80, 80, 80, .24)';
    context.lineWidth = 1.5;
    context.stroke();

    context.save();
    context.translate(center, center);
    context.rotate(start + slice / 2);
    context.translate(radius * .72, 0);
    context.rotate(Math.PI / 2);
    context.fillStyle = '#070707';
    context.font = `700 ${Math.max(28, Math.min(53, 310 / items.length + 17))}px Arial, sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(item, 0, 0);
    context.restore();
  });

  context.beginPath();
  context.arc(center, center, radius, 0, Math.PI * 2);
  context.strokeStyle = 'rgba(40, 40, 40, .34)';
  context.lineWidth = 2;
  context.stroke();
  context.restore();
}

function refreshItems() {
  items = getItems();
  drawWheel();
}

function showBanner(message) {
  resultText.textContent = message;
  resultBanner.classList.add('visible');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => resultBanner.classList.remove('visible'), 5000);
}

function spin() {
  if (spinning) return;
  refreshItems();
  spinning = true;
  spinButton.disabled = true;
  overlaySpin.disabled = true;
  overlaySpin.classList.add('is-hidden');

  const selectedIndex = Math.floor(Math.random() * items.length);
  const slice = (Math.PI * 2) / items.length;
  const targetAngle = Math.PI / 2 - selectedIndex * slice - slice / 2;
  const currentTurns = Math.floor(rotation / (Math.PI * 2));
  const normalizedTarget = targetAngle + currentTurns * Math.PI * 2;
  const finalRotation = normalizedTarget - rotation > 0
    ? normalizedTarget + Math.PI * 2 * 6
    : normalizedTarget + Math.PI * 2 * 7;
  const startRotation = rotation;
  const distance = finalRotation - startRotation;
  const duration = 4200;
  const startTime = performance.now();

  function animate(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    rotation = startRotation + distance * eased;
    drawWheel();
    if (progress < 1) {
      requestAnimationFrame(animate);
      return;
    }
    spinning = false;
    spinButton.disabled = false;
    overlaySpin.disabled = false;
    overlaySpin.classList.remove('is-hidden');
    winningItem = items[selectedIndex];
    showBanner(`Resultado: ${items[selectedIndex]}`);
  }
  requestAnimationFrame(animate);
}

function removeWinner() {
  if (winningItem === null) return;
  const remainingItems = itemsInput.value.split('\n');
  const winnerIndex = remainingItems.findIndex((item) => item.trim() === winningItem);
  if (winnerIndex !== -1) remainingItems.splice(winnerIndex, 1);
  itemsInput.value = remainingItems.join('\n');
  resultBanner.classList.remove('visible');
  winningItem = null;
  refreshItems();
}

function reset() {
  itemsInput.value = initialItems.join('\n');
  items = [...initialItems];
  rotation = 0;
  winningItem = null;
  drawWheel();
  resultBanner.classList.remove('visible');
  overlaySpin.classList.remove('is-hidden');
}

spinButton.addEventListener('click', spin);
overlaySpin.addEventListener('click', spin);
resetButton.addEventListener('click', reset);
itemsInput.addEventListener('input', refreshItems);
editButton.addEventListener('click', () => {
  itemsInput.focus();
  itemsInput.select();
});
hideButton.addEventListener('click', () => overlaySpin.classList.toggle('is-hidden'));
titleButton.addEventListener('click', () => {
  const title = window.prompt('Título de la ruleta:', 'La Ruleta Aleatoria');
  if (title !== null && title.trim()) document.querySelector('h1').textContent = title.trim();
});
closeBanner.addEventListener('click', () => resultBanner.classList.remove('visible'));

document.addEventListener('keydown', (event) => {
  if (event.target === itemsInput && event.key !== 'Escape') return;
  if (event.code === 'Space') { event.preventDefault(); spin(); }
  if (event.key.toLowerCase() === 'r') reset();
  if (event.key.toLowerCase() === 'e') { itemsInput.focus(); itemsInput.select(); }
  if (event.key.toLowerCase() === 'x') resultBanner.classList.remove('visible');
  if (event.key.toLowerCase() === 's') removeWinner();
  if (event.key.toLowerCase() === 'f') {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }
});

drawWheel();
