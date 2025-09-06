let currentView = 'all';
let currentActiveButton = null;
const staticDir = "./static/";
let totalJokers = 0;
const jokerTooltipData = {};
let tooltipTimer = null;
let currentHoveredCard = null;
let currentMousePosition = { x: 0, y: 0 };

document.addEventListener('DOMContentLoaded', () => {
    initPage()
        .then(() => {
            setDefaultView();
            updateStats();
        });
});

 window.addEventListener('scroll', function() {
    const stickyHeader = document.querySelector('.sticky-top');
    const stickyHeaderDiv = stickyHeader.querySelector('.row');
    const headerMarginBotton = parseInt(getComputedStyle(stickyHeaderDiv).marginBottom, 10);
    if (window.scrollY > headerMarginBotton) {
        stickyHeader.classList.add('sticky-active');
    } else {
        stickyHeader.classList.remove('sticky-active');
    }
});


function generateJokerGrid(jokers) {
    const container = document.getElementById('joker-grid');

    jokers.forEach(joker => {
        const jokerState = localStorage.getItem('card:' + joker.id) === 'true';

        const jokerHtml = `
            <div class="joker-container col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
                <div class="card pixel-corners h-100" id="${joker.id}" onclick="handleCardClick(this)">
                    <div class="card-body">
                        <img src="${staticDir}jokers/${joker.image}" alt="${joker.name}" class="card-img-bottom">
                        <div class="form-check py-1">
                            <input type="checkbox" id="${joker.id}.checkbox" ${jokerState ? 'checked' : ''} onchange="updateView()">
                            <label for="${joker.id}.checkbox" class="custom-checkbox">${joker.name}</label>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += jokerHtml;
        
        // add tooltip listeners
        jokerTooltipData[joker.id] = {
            name: joker.name,
            description: joker.description,
            rarity: joker.rarity
        };
    });
}

function initPage() {
    return fetch(staticDir + "jokers.json", {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Getting joker list error');
        }
        return response.json();
    })
    .then(data => {
        totalJokers = data.length;
        // console.log('Success:', data);
        generateJokerGrid(data);
        setupTooltipEvents(); // Set up tooltip event listeners
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('Error, check the console');
   });
}

function handleCardClick(card) {
    const checkbox = card.querySelector('input[type="checkbox"]');
    checkbox.checked = !checkbox.checked
    localStorage.setItem('card:' + card.id, checkbox.checked);
    updateStats();

    const event = new Event('change', {
        bubbles: true,
        cancelable: true
    });
    checkbox.dispatchEvent(event);
}

function updateStats() {
    const checkboxes = document.querySelectorAll('.joker-container input[type="checkbox"]');
    const checkedCount = Array.from(checkboxes).filter(checkbox => checkbox.checked).length;
    console.log(totalJokers);
    const percentage = ((checkedCount / totalJokers) * 100).toFixed(2);

    const statsElement = document.getElementById("stats");
    const progressBar = document.getElementById('progress');

    statsElement.textContent = `${checkedCount}/${totalJokers} (${percentage}%)`;
    progressBar.ariaValueNow = percentage;
    progressBar.style.width = percentage + '%';

    console.log("Updated Stats:", statsElement.textContent);
}

function setAllState(state) {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const checkbox = card.querySelector('input[type="checkbox"]');
        checkbox.checked = state
        localStorage.setItem('card:' + card.id, checkbox.checked);

        const event = new Event('change', {
            bubbles: true,
            cancelable: true
        });
        checkbox.dispatchEvent(event);
   });
    updateStats();
}

function updateView() {
    if (currentView === 'checked') {
        showChecked(currentActiveButton);
    } else if (currentView === 'unchecked') {
        showUnchecked(currentActiveButton);
    } else {
        showAll(currentActiveButton);
    }
}

function filterStickers(button) {
    const containers = document.querySelectorAll('.joker-container');
    switch (button.id) {
        case 'filter-all':
            currentView = 'all';
            containers.forEach(container => {
                container.style.display = 'block';
           });
            break;
        case 'filter-stickers-only':
            currentView = 'checked';
            containers.forEach(container => {
                const checkbox = container.querySelector('input[type="checkbox"]');
                container.style.display = checkbox.checked ? 'block' : 'none';
            });
            break;
        case 'filter-no-stickers-only':
            currentView = 'unchecked';
            containers.forEach(container => {
                const checkbox = container.querySelector('input[type="checkbox"]');
                container.style.display = !checkbox.checked ? 'block' : 'none';
            });
            break;
        default:
            return;
    }
}

function showAll(button) {
    highlightButton(button);
    currentView = 'all';

    const containers = document.querySelectorAll('.joker-container');
    containers.forEach(container => {
        container.style.display = 'block';
   });
}

function showChecked(button) {
    highlightButton(button);
    currentView = 'checked';

    const containers = document.querySelectorAll('.joker-container');
    containers.forEach(container => {
        const checkbox = container.querySelector('input[type="checkbox"]');
        container.style.display = checkbox.checked ? 'block' : 'none';
    });
}

function showUnchecked(button) {
    highlightButton(button);
    currentView = 'unchecked';

    const containers = document.querySelectorAll('.joker-container');
    containers.forEach(container => {
        const checkbox = container.querySelector('input[type="checkbox"]');
        container.style.display = !checkbox.checked ? 'block' : 'none';
    });
}

function highlightButton(button) {
    const allButtons = document.querySelectorAll('.button-container .pixel-corners');
    allButtons.forEach(btn => {
        btn.style.backgroundColor = '#2A3839';
    });

    if (button) {
        button.style.backgroundColor = 'lightgreen';
        currentActiveButton = button;
    } else if (currentActiveButton) {
        currentActiveButton.style.backgroundColor = 'lightgreen';
    }
}

function setDefaultView() {
    const showAllButton = document.getElementById('showAllButton');
    showAll(showAllButton);
}


// ---- profile handling ----
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('profileInput').addEventListener('change', async function(event) {
        const file = event.target.files[0];
        if (file) {
            try {
                const decompressedData = await decompressFile(file);
                const saveData = parseObj(decompressedData);
                console.log(saveData);
                const jokers = prepareJokerData(saveData);
                console.log(jokers);
                setStatsFromProfile(jokers);
            } catch (err) {
                console.error('Decompression failed:', err);
                alert('Error, check the console');
            }
        }
    });
});

function decompressFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const arrayBuffer = e.target.result;
                const uint8Array = new Uint8Array(arrayBuffer);
                const decompressedData = pako.inflateRaw(uint8Array);
                const decodedData = new TextDecoder().decode(decompressedData);
                resolve(decodedData); // Возвращаем распакованные данные
            } catch (err) {
                reject(err); // Возвращаем ошибку
            }
        };
        reader.onerror = function(err) {
            reject(err);
        };
        reader.readAsArrayBuffer(file);
    });
}

function parseObj(data){
    let result = data.slice(7)
        .replace(/\[/g, "")
        .replace(/\]/g, "")
        .replace(/=/g, ":")
        .replace(/,}/g, "}")
        .replace(/(\d+):/g, (match, p1) => `"${p1}":`);
    return JSON.parse(result);
}

function prepareJokerData(data){
    let jokers = {};
    for (const [jId, playInfo] of Object.entries(data['joker_usage'])) {
        jokers[jId] = playInfo['wins']['8'] != null;
    }
    return jokers;
}

function setStatsFromProfile(jokers){
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const state = jokers[card.id] === true;
        const checkbox = card.querySelector('input[type="checkbox"]');
        checkbox.checked = state
        localStorage.setItem('card:' + card.id, checkbox.checked);

        const event = new Event('change', {
            bubbles: true,
            cancelable: true
        });
        checkbox.dispatchEvent(event);
   });
    updateStats();
}

function setupTooltipEvents() {
    const tooltip = document.getElementById('joker-tooltip');
    // Add tooltip event listeners (only once, outside the loop)
    document.addEventListener('mouseover', function(e) {
        const card = e.target.closest('.card');
        if (card && card.id) {
            startTooltipTimer(card, e);
        }
    });

    document.addEventListener('mouseout', function(e) {
        const card = e.target.closest('.card');
        if (card && card.id) {
            clearTooltipTimer();
            hideTooltip();
        }
    });

    document.addEventListener('mousemove', function(e) {
        const card = e.target.closest('.card');
        if (card && card.id) {
            // Update stored mouse position
            currentMousePosition = { x: e.clientX, y: e.clientY };
            
            // If we're hovering over a different card, restart the timer
            if (currentHoveredCard !== card.id) {
                clearTooltipTimer();
                startTooltipTimer(card, e);
            }
            // If tooltip is already showing, update its position
            if (tooltip.classList.contains('show')) {
                updateTooltipPosition(e.clientX, e.clientY);
            }
        } else {
            clearTooltipTimer();
            hideTooltip();
        }
    });

    document.addEventListener('scroll', function(e) {
        hideTooltip();
    });
}

function startTooltipTimer(card, e) {
    clearTooltipTimer();
    currentHoveredCard = card.id;
    currentMousePosition = { x: e.clientX, y: e.clientY };
    
    tooltipTimer = setTimeout(() => {
        showTooltip(card);
    }, 500);
}

function clearTooltipTimer() {
    if (tooltipTimer) {
        clearTimeout(tooltipTimer);
        tooltipTimer = null;
    }
    currentHoveredCard = null;
}

function showTooltip(card) {
    const tooltip = document.getElementById('joker-tooltip');
    
    // Get joker data directly using the card ID
    const jokerData = jokerTooltipData[card.id];
    
    if (!jokerData) {
        console.warn('No joker data found for:', card.id);
        return;
    }
    
    // Map rarity numbers to display names
    const rarityNames = {
        1: 'Common',
        2: 'Uncommon', 
        3: 'Rare',
        4: 'Legendary'
    };
    
    // Update tooltip content
    tooltip.querySelector('.tooltip-title').textContent = jokerData.name;
    
    const rarityElement = tooltip.querySelector('.tooltip-rarity');
    const rarity = jokerData.rarity;
    rarityElement.textContent = rarityNames[rarity] || 'Unknown';
    rarityElement.className = `tooltip-rarity rarity-${rarity}`;
    
    tooltip.querySelector('.tooltip-description').innerHTML = jokerData.description;
    
    // Position and show tooltip using stored mouse position
    updateTooltipPosition(currentMousePosition.x, currentMousePosition.y);
    tooltip.classList.add('show');
}

function hideTooltip() {
    const tooltip = document.getElementById('joker-tooltip');
    tooltip.classList.remove('show');
}

function updateTooltipPosition(mouseX, mouseY) {
    const tooltip = document.getElementById('joker-tooltip');
    const offset = 15;
    
    // Get tooltip dimensions
    const tooltipRect = tooltip.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Center the tooltip horizontally under the cursor (accounting for scroll)
    let left = mouseX - (tooltipRect.width / 2);
    let top = mouseY + offset;
    
    // Adjust horizontal position if tooltip would go off screen
    // Keep it as close to centered as possible while staying on screen
    if (left < 5) {
        left = 5;
    } else if (left + tooltipRect.width > windowWidth - 5) {
        left = windowWidth - tooltipRect.width - 5;
    }
    
    // Adjust vertical position if tooltip would go off screen
    if (top + tooltipRect.height > windowHeight - 5) {
        top = mouseY - tooltipRect.height - offset;
    }
    
    // Ensure tooltip doesn't go off the top edge
    top = Math.max(5, top);
    
    // Apply positioning with fixed positioning relative to viewport
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.position = 'fixed';
}