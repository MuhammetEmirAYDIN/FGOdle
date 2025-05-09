const backgroundImages = [
    'images/Wandering Sea.png',
    'images/Captain Ship 2.png',
    'images/Captain Ship 3.png',
    'images/Shadow Border 2.png',
    'images/Shadow Border Cockpit.png',
    'images/Tsar_s Room.png',
    'images/Patxi_s Home.png',
];


function setRandomBackground() {
    const randomImage = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
    document.body.style.backgroundImage = `url('${randomImage}')`;
}

function getTodaySeed()
{
    const Today = new Date();
    const year = Today.getFullYear();
    const month = Today.getMonth()+1;
    const day = Today.getDate();
    return `${year}-${month}-${day}`
}

function hashToNumber(str,max)
{
    let hash = 0;
    for(let i = 0; i< str.length;i++)
    {
        hash= (hash << 5)- hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash) % max;    
}


window.onload = setRandomBackground;

for (let i = 0; i < 3; i++) {
    const hintContainer = document.getElementById(`hint${i + 1}Countdown`).parentElement;
    hintContainer.addEventListener('click', () => {
        if (hintUnlocked[i] && !hintShownFlags[i]) {
            const hintKey = `hint${i + 1}`;
            const newHint = answer[hintKey];
            if (newHint) {
                const revealed = document.getElementById("revealedHints");
                const hintP = document.createElement("p");
                hintP.textContent = `Hint ${i + 1}: ${newHint}`;
                hintP.className = `revealed-hint hint-${i + 1}`;
                revealed.appendChild(hintP);
            }

            hintContainer.style.display = "none";
            hintShownFlags[i] = true;
            hintsShown++;
        }
    });
}

function updateStreakOnWin() {
    const today = new Date().toISOString().split('T')[0];
    const lastPlayed = localStorage.getItem('lastPlayedDate');
    let currentStreak = parseInt(localStorage.getItem('fgoStreak') || '0', 10);

    if (lastPlayed) {
        const lastDate = new Date(lastPlayed);
        const diffDays = Math.floor((new Date(today) - lastDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
            currentStreak++; // Continue streak
        } else if (diffDays === 0) {
            // Already played today, no change
        } else {
            currentStreak = 1; // Reset
        }
    } else {
        currentStreak = 1; // First ever win
    }

    localStorage.setItem('lastPlayedDate', today);
    localStorage.setItem('fgoStreak', currentStreak.toString());
}

  

let dropdown;

function setupCustomDropdown() {
    const input = document.getElementById('guessInput');
    
    // Create dropdown element
    dropdown = document.createElement('div');
    dropdown.id = 'customDropdown';

    // Add dropdown after input
    input.parentNode.insertBefore(dropdown, input.nextSibling);
    
    // Position dropdown under the input
    function updatePosition() {
        const rect = input.getBoundingClientRect();
        dropdown.style.left = rect.left + window.scrollX + 'px';
        dropdown.style.top = rect.bottom + window.scrollY + 'px';
        dropdown.style.width = input.offsetWidth + 'px';
    }
    
    // Update position initially and on window resize
    updatePosition();
    window.addEventListener('resize', updatePosition);
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', (event) => {
        if (event.target !== input && event.target !== dropdown) {
            dropdown.style.display = 'none';
        }
    });
}

function updateDropdown(servants) {
    if (!dropdown) return;
    
    dropdown.innerHTML = '';
    const input = document.getElementById('guessInput');
    
    if (servants.length > 0 && input.value.trim() !== '') {
        dropdown.style.display = 'block';
        
        servants.forEach(servant => {
            const option = document.createElement('div');
            option.className ='dropdown-option';

            const img = document.createElement('img');
            img.src = servant.image;
            img.alt = servant.name;
            img.className = 'dropdown-option-img';
            img.classList.add('servant-image');
            
            // Add servant name
            const nameText = document.createElement('span');
            nameText.textContent = servant.name;
            option.appendChild(img);
            option.appendChild(nameText);
            
            option.addEventListener('click', () => {
                input.value = servant.name;
                dropdown.style.display = 'none';
            });
            
            dropdown.appendChild(option);
        });
    } else {
        dropdown.style.display = 'none';
    }
}

// Update your main code to use the custom dropdown
let servantList = [];
let answer = null;
let wrongGuessCount = 0;
let hintThresholds = [5, 8, 11];
let hintUnlocked = [false, false, false];
const hintShownFlags = [false, false, false];
let hintsShown = 0;
let hintAvailable = [false,false,false];
let currentStreak = parseInt(localStorage.getItem("fgoStreak")) || 0;;
let hasGuessedCorrectly = false;


function refreshHintsUI() {
    for (let i = 0; i < 3; i++) {
        const countdownSpan = document.getElementById(`hint${i + 1}Countdown`);
        const container = countdownSpan.parentElement;

        if (hintShownFlags[i]) {
            container.style.display = "none";
        } else if (wrongGuessCount >= hintThresholds[i]) {
            hintUnlocked[i] = true;
            countdownSpan.textContent = "Unlock Hint";
            countdownSpan.classList.add("clickable-hint");
            countdownSpan.style.cursor = "pointer";
        } else {
            const remaining = hintThresholds[i] - wrongGuessCount;
            countdownSpan.textContent = remaining > 0 ? remaining : 0;
            countdownSpan.classList.remove("clickable-hint");
            countdownSpan.style.cursor = "default";
        }
    }
}
refreshHintsUI();
for (let i = 0; i < 3; i++) {
    const countdownSpan = document.getElementById(`hint${i + 1}Countdown`);
    const hintContainer = countdownSpan.parentElement;

    hintContainer.addEventListener('click', () => {
        if (hintUnlocked[i] && !hintShownFlags[i]) {
            const hintKey = `hint${i + 1}`;
            const newHint = answer[hintKey];
            if (newHint) {
                const revealed = document.getElementById("revealedHints");
                const hintP = document.createElement("p");
                hintP.textContent = `Hint ${i + 1}: ${newHint}`;
                hintP.className = `revealed-hint hint-${i + 1}`;
                revealed.appendChild(hintP);
            }

            hintContainer.style.display = "none";
            hintShownFlags[i] = true;
            hintsShown++;
        }
    });
}

fetch('servants.json')
    .then(res => res.json())
    .then(data => {
        servantList = data;
        servantList.forEach(servant => {
            if (servant.aligment) {
                // Convert order to array if it's not already
                if (!Array.isArray(servant.aligment.order)) {
                    servant.aligment.order = [servant.aligment.order];
                }
        
                // Convert morality to array if it's not already
                if (!Array.isArray(servant.aligment.morality)) {
                    servant.aligment.morality = [servant.aligment.morality];
                }
            }
        });
        // Initialize dropdown after data is loaded
       
        const seed = getTodaySeed();
        const index = hashToNumber(seed,servantList.length);
        answer = servantList[index];
        //answer = servantList[Math.floor(Math.random() * servantList.length)];
        console.log("Random servant selected:", answer.name);
        setupCustomDropdown();
    });

const input = document.getElementById("guessInput");

function showinModal()
{
    const modal = document.getElementById("winmodal");
    const streakText = document.getElementById("StreakText");
    const currentStreak = localStorage.getItem("fgoStreak") || 0;
    streakText.textContent = "Current Streak:" +currentStreak + "🔥";
    modal.style.display = "block";
}

document.querySelector(".close-button").addEventListener("click",() => {
    document.getElementById("winmodal").style.display = "none";
})

window.addEventListener("click", (event) => {
    const modal = document.getElementById("winmodal");
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
input.addEventListener("input", (event) => {
    const query = event.target.value.toLowerCase().trim();
    console.log(`Query: '${query}'`);

    if(query) {
        const filteredServants = servantList.filter(servant => {
            // Check name matches
            const nameParts = servant.name.toLowerCase().split(/\s+/);
            const nameMatches = nameParts.some(part => part.startsWith(query));
            
            // Check alias matches
            let aliasMatches = false;
            if (servant.aliases && Array.isArray(servant.aliases)) {
                aliasMatches = servant.aliases.some(alias => 
                    alias.toLowerCase().startsWith(query)
                );
                
                if (aliasMatches) {
                    console.log(`Found match by alias: ${servant.name} has alias that matches '${query}'`);
                }
            }
            
            return nameMatches || aliasMatches;
        });
        
        console.log(`Found ${filteredServants.length} matching servants`);
        updateDropdown(filteredServants);
    } else {
        updateDropdown([]);
    }
});


const submitbtn = document.getElementById("submitGuess");

const feedback = document.getElementById("feedback");
const guessesDiv = document.getElementById("guesses");




submitbtn.addEventListener("click", () => {
    const guessText = input.value.trim().toLowerCase();
    
    if (hasGuessedCorrectly) return; 


    if(!answer || !servantList.length) return;

    const  guessed = servantList.find(s =>{
        const allNames = [s.name.toLowerCase(), ...(s.aliases || []).map(n => n.toLowerCase())];
        return allNames.includes(guessText);
    });

    if (!guessed) {
        feedback.textContent = `Servant not found!`;
        feedback.style.color = "red";
        return;
    } 

    
    const isCorrect = guessed.name.toLowerCase() === answer.name.toLowerCase();
    if (isCorrect) 
    {
        hasGuessedCorrectly = true;
        updateStreakOnWin();
        showinModal();
        
        
    }
    else
    {
        wrongGuessCount++;
        refreshHintsUI();
    }

        const row = document.createElement("div");
        row.className = "guess-row";

        
        const makeBox = (text, state, arrow = null) => {
            const box = document.createElement("div");
            box.className = `hint-box ${state}`;
            if (arrow) box.classList.add(arrow);
            
            const span = document.createElement("span");
            span.textContent =text;
            box.appendChild(span);
            return box;
        };

        
        const imageBox = document.createElement("div");
        imageBox.className = "guess-image";
        const img = document.createElement('img');
        img.src = guessed.image;
        img.alt = guessed.name;
        img.className = 'guess-servant-image';
        imageBox.appendChild(img);
        row.appendChild(imageBox);

        row.appendChild(makeBox(guessed.name, guessed.name === answer.name ? "correct" : "wrong"));

        let compareBox = (val, correct, label) => {
            let state = val === correct ? "correct" : "wrong";
            let arrow = val < correct ? "up" : val > correct ? "down" : null;
            row.appendChild(makeBox(val, state, arrow));
        };

        compareBox(guessed.height, answer.height);
        compareBox(guessed.weight, answer.weight);

        row.appendChild(makeBox(guessed.gender, guessed.gender === answer.gender ? "correct" : "wrong"));
        row.appendChild(makeBox(guessed.class, guessed.class === answer.class ? "correct" : "wrong"));

        compareBox(guessed.year, answer.year);
        compareBox(guessed.rarity, answer.rarity);

        const gAligns = [];
const aAligns = [];

guessed.aligment.order.forEach(order => {
    guessed.aligment.morality.forEach(morality => {
        gAligns.push({ order, morality });
    });
});

answer.aligment.order.forEach(order => {
    answer.aligment.morality.forEach(morality => {
        aAligns.push({ order, morality });
    });
});
        
        let alignMatch = "wrong";
        
        for (const gAlign of gAligns) {
            for (const aAlign of aAligns) {
                const fullMatch = gAlign.order === aAlign.order && gAlign.morality === aAlign.morality;
                const partialMatch = gAlign.order === aAlign.order || gAlign.morality === aAlign.morality;
        
                if (fullMatch) {
                    // Only mark full match as correct if there's only ONE alignment on both sides
                    if (gAligns.length === 1 && aAligns.length === 1) {
                        alignMatch = "correct";
                    } else {
                        alignMatch = "partial";
                    }
                    break;
                } else if (partialMatch && alignMatch !== "partial") {
                    alignMatch = "partial";
                }
            }
            if (alignMatch === "correct") break;
        }
        
        // Format all guessed alignments for display
        const alignText = gAligns.map(a => `${a.order} ${a.morality}`).join("\n");
        row.appendChild(makeBox(alignText, alignMatch));
        
        guessesDiv.insertBefore(row, guessesDiv.firstChild);

        if (isCorrect) {
            input.disabled = true;
            submitbtn.disabled = true;
            showinModal();
        }

        guessesDiv.prepend(row);
        input.value = "";
        feedback.textContent = "";  
        servantList = servantList.filter(s => s.name.toLowerCase() !== guessed.name.toLowerCase());
        updateDropdown([]);
    });