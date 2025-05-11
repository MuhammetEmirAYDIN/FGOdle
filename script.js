const backgroundImages = [
    'images/Wandering Sea.png',
    'images/Captain Ship 2.png',
    'images/Captain Ship 3.png',
    'images/Shadow Border 2.png',
    'images/Shadow Border Cockpit.png',
    'images/Tsar_s Room.png',
    'images/Patxi_s Home.png',
];

const feedback = document.getElementById("feedback");
const input = document.getElementById("guessInput");
const guessesDiv = document.getElementById("guesses");
const submitbtn = document.getElementById("submitGuess");
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


function updateStreakOnWin() {
    const today = new Date().toISOString().split('T')[0];
    const lastPlayed = localStorage.getItem('lastPlayedDate');
    let currentStreak = parseInt(localStorage.getItem('fgoStreak') || '0', 10);

    if (lastPlayed) {
        const lastDate = new Date(lastPlayed);
        const diffDays = Math.floor((new Date(today) - lastDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
            currentStreak++; 
        } else if (diffDays === 0) {
           
        } else {
            currentStreak = 1; 
        }
    } else {
        currentStreak = 1; 
    }

    localStorage.setItem('lastPlayedDate', today);
    localStorage.setItem('fgoStreak', currentStreak.toString());
}

  

let dropdown;

function setupCustomDropdown() {
    const input = document.getElementById('guessInput');
    
    
    dropdown = document.createElement('div');
    dropdown.id = 'customDropdown';

   
    input.parentNode.insertBefore(dropdown, input.nextSibling);
    
    
    function updatePosition() {
        const rect = input.getBoundingClientRect();
        dropdown.style.left = rect.left + window.scrollX + 'px';
        dropdown.style.top = rect.bottom + window.scrollY + 'px';
        dropdown.style.width = input.offsetWidth + 'px';
    }
    
    
    updatePosition();
    window.addEventListener('resize', updatePosition);
    
    
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


let servantList = [];
let allServants = [];
let answer = null;
let wrongGuessCount = 0;
let hintThresholds = [5, 8, 11];
let hintUnlocked = [false, false, false];
const hintShownFlags = [false, false, false];
let hintsShown = 0;
let hintAvailable = [false,false,false];
let currentStreak = parseInt(localStorage.getItem("fgoStreak")) || 0;;
let hasGuessedCorrectly = false;
let gameMode = 'daily';
let currentServant = null;

document.getElementById("dailyMode").onclick = () => {
gameMode = 'daily';
document.getElementById("refreshRandom").style.display = "none";
loadDailyServant();
restartGame();
};

document.getElementById("randomMode").onclick = () => {
  gameMode = 'random';
  document.getElementById("refreshRandom").style.display = "inline";
  loadRandomServant();
  restartGame();
};

document.getElementById("refreshRandom").onclick = () => {
  if (gameMode === 'random') loadRandomServant();
  restartGame();
};

function refreshHintsUI() {
    for (let i = 0; i < 3; i++) {
        const countdownSpan = document.getElementById(`hint${i + 1}Countdown`);
        const container = countdownSpan.parentElement;

        if (hintShownFlags[i]) {
            container.style.display = "none";
        } else if (hintUnlocked[i]) {
            
            countdownSpan.textContent = "Unlock Hint";
            countdownSpan.classList.add("clickable-hint");
            countdownSpan.style.cursor = "pointer";
        } else {
            const remaining = hintThresholds[i] - wrongGuessCount;
            countdownSpan.textContent = remaining > 0 ? remaining : 0;
            countdownSpan.classList.remove("clickable-hint");
            countdownSpan.style.cursor = "default";
            container.style.display = "block" 
        }
    }
}

refreshHintsUI();


fetch('servants.json')
    .then(res => res.json())
    .then(data => {
        servantList = [...data];
        allServants = [...data];
        servantList.forEach(servant => {
            if (servant.aligment) {
                
                if (!Array.isArray(servant.aligment.order)) {
                    servant.aligment.order = [servant.aligment.order];
                }

                
                if (!Array.isArray(servant.aligment.morality)) {
                    servant.aligment.morality = [servant.aligment.morality];
                }
            }
        });

       
        if (gameMode === 'daily') {
            
            loadDailyServant();
        } else {
            
            loadRandomServant();
        }
        

        setupCustomDropdown();
    })
    .catch(error => {
        console.error("Error loading servant data:", error);
    });

function loadDailyServant() {
    const today = getTodaySeed();
    const index = hashToNumber(today, servantList.length);
    currentServant = servantList[index];
    answer = currentServant;

   
    
    resetGameState();
}

function loadRandomServant() {
    const index = Math.floor(Math.random() * servantList.length);
    currentServant = servantList[index];
    answer = currentServant;

    
    
    resetGameState();
}
function restartGame() {
    hasGuessedCorrectly = false;
    wrongGuessCount = 0;

    input.disabled = false;
    submitbtn.disabled = false;

    input.value = "";
    feedback.textContent = "";
    feedback.style.color = "black";

    guessesDiv.innerHTML = "";

    servantList = [...allServants]; 
    updateDropdown([]);
}

function resetGameState() {
    input.value = '';
    wrongGuessCount = 0;
    hintsShown = 0;
    hasGuessedCorrectly = false;

    document.getElementById("guessInput").disabled = false;
    document.getElementById("submitGuess").disabled = false;
    feedback.innerHTML = '';
    guessesDiv.innerHTML = '';


    for (let i = 0; i < 3; i++) 
    {
        hintUnlocked[i] = false;
        hintShownFlags[i] = false;
    }
    
    const revealedContainer = document.getElementById("revealedHints");
    revealedContainer.innerHTML = '';

    
    for (let i = 0; i < 3; i++) {
        if (hintShownFlags[i]) {
            const hintKey = `hint${i + 1}`;
            const hintText = answer[hintKey];
            const hintP = document.createElement("p");
            hintP.textContent = `Hint ${i + 1}: ${hintText}`;
            hintP.className = `revealed-hint hint-${i + 1}`;
            revealedContainer.appendChild(hintP);
        }
    }
    
    refreshHintsUI();
}



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

            
            const revealedHints = JSON.parse(localStorage.getItem('revealedHints') || '[]');
            revealedHints.push({ index: i, text: newHint });
            localStorage.setItem('revealedHints', JSON.stringify(revealedHints));
        }

        hintContainer.style.display = "none";
        hintShownFlags[i] = true;
        hintsShown++;
    }
});
}



function showinModal()
{
    const modal = document.getElementById("winmodal");
    const streakText = document.getElementById("StreakText");
    const currentStreak = localStorage.getItem("fgoStreak") || 0;
    streakText.textContent = "Current Streak:" +currentStreak + "🔥";
    modal.style.display = "block";
}

if (gameMode === 'daily') {
  loadDailyServant();
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
    

    if(query) {
        const filteredServants = servantList.filter(servant => {
            
            const nameParts = servant.name.toLowerCase().split(/\s+/);
            const nameMatches = nameParts.some(part => part.startsWith(query));
            
            
            let aliasMatches = false;
            if (servant.aliases && Array.isArray(servant.aliases)) {
                aliasMatches = servant.aliases.some(alias => 
                    alias.toLowerCase().startsWith(query)
                );
                
                if (aliasMatches) {
                    
                }
            }
            
            return nameMatches || aliasMatches;
        });
        
        updateDropdown(filteredServants);
    } else {
        updateDropdown([]);
    }
});










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
        for (let i = 0; i < 3; i++) {
    if (!hintUnlocked[i] && wrongGuessCount >= hintThresholds[i]) {
        hintUnlocked[i] = true;
    }
}
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
            let state = "wrong";
            let arrow = null;

            if (val == correct)
            {
                state = "correct";
            }

            else if (!isNaN(val) && !isNaN(correct)) 
            {
                let valNum = Number(val);
                let correctNum = Number(correct);   
                arrow = valNum < correctNum ? "up" : "down";
            }
            if (val == "-" || correct == "-") 
            {
                arrow =  null;
            }

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

    window.addEventListener("load", () => {
    hasGuessedCorrectly = false;
    wrongGuessCount = 0;

    input.disabled = false;
    submitbtn.disabled = false;

    input.value = "";
    feedback.textContent = "";
    feedback.style.color = "black";

    servantList= [...allServants];

    updateDropdown([]);
});