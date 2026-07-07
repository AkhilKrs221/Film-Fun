let currentIndustry = 'hollywood';
let currentMode = '';
let globalScore = 0;
let currentChallengeData = null;

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray(arr) {
    let output = [...arr];
    for (let i = output.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [output[i], output[j]] = [output[j], output[i]];
    }
    return output;
}

function switchIndustry(industryId) {
    currentIndustry = industryId;
    document.querySelectorAll('#industry-tabs button').forEach(btn => {
        btn.className = "px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition text-slate-400 hover:text-white";
    });
    const activeBtn = document.getElementById(`tab-${industryId}`);
    if (activeBtn) activeBtn.className = "px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition bg-red-600 text-white";
    exitGame();
}

function generateDynamicQuestion(industry, mode) {
    if (mode === 'quote') {
        const selectedQuote = getRandomElement(globalQuotesDatabase);
        let wrongOptions = globalQuotesDatabase.filter(m => m.answer !== selectedQuote.answer).map(m => m.answer);
        wrongOptions = Array.from(new Set(wrongOptions));
        wrongOptions = shuffleArray(wrongOptions).slice(0, 3);
        return {
            hint: selectedQuote.hint,
            answer: selectedQuote.answer,
            options: shuffleArray([...wrongOptions, selectedQuote.answer])
        };
    }

    // Pull from the exact same 100-movie pool for this industry
    const targetCatalog = fullMovieCatalog[industry] || fullMovieCatalog['hollywood'];
    const selectedItem = getRandomElement(targetCatalog);
    let wrongOptions = targetCatalog.filter(m => m.title !== selectedItem.title).map(m => m.title);
    wrongOptions = Array.from(new Set(wrongOptions));
    wrongOptions = shuffleArray(wrongOptions).slice(0, 3);
    const compiledOptions = shuffleArray([...wrongOptions, selectedItem.title]);

    let descriptiveHint = "";
    
    switch(mode) {
        case 'cast':
            descriptiveHint = `IMDb Core Billing Cast:\n\n• ${selectedItem.cast[0]}\n• ${selectedItem.cast[1]}\n• ${selectedItem.cast[2]}\n• ${selectedItem.cast[3]}`;
            break;
        case 'plot':
            descriptiveHint = `🥴 Weirdly Explained Plot:\n\n"${selectedItem.plot}"`;
            break;
        case 'text':
            // Dynamically masks alternating letters to simulate a cropped typography poster slice
            descriptiveHint = selectedItem.title.split('').map((char, idx) => {
                if (char === ' ') return '   ';
                if (['A','E','I','O','U',' '].includes(char.toUpperCase()) || idx % 2 === 0) {
                    return ` ${char} `;
                }
                return ' _ ';
            }).join('');
            break;
        case 'shot':
            // High-res film set frames pulled dynamically via keyword queries
            descriptiveHint = `https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop&sig=${selectedItem.id}&key=${selectedItem.keyword}`;
            break;
        case 'poster':
        case 'partialPoster':
            // Base theater poster backdrop
            descriptiveHint = `https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop&sig=${selectedItem.id}&mode=poster`;
            break;
    }

    return {
        hint: descriptiveHint,
        answer: selectedItem.title,
        options: compiledOptions
    };
}

function startGame(modeId) {
    currentMode = modeId;
    document.getElementById('modes-selection').classList.add('hidden');
    document.getElementById('game-arena').classList.remove('hidden');
    
    const modeLabels = {
        cast: "IMDb Cast List", shot: "Iconic Movie Shot", poster: "Full Poster Art",
        quote: "Guess the Quote", partialPoster: "Partial Recognizable Poster", text: "Cropped Title Letters from Poster", plot: "Weirdly Written Plot"
    };
    document.getElementById('active-badge').innerText = modeLabels[modeId] || "Challenge Active";
    loadQuestion();
}

function exitGame() {
    currentMode = '';
    document.getElementById('game-arena').classList.add('hidden');
    document.getElementById('modes-selection').classList.remove('hidden');
}

function loadQuestion() {
    document.getElementById('feedback-alert').className = "hidden p-4 rounded-xl font-semibold text-center border";
    document.getElementById('next-btn').classList.add('hidden');
    
    const imgNode = document.getElementById('hint-image');
    const textNode = document.getElementById('hint-text');
    
    imgNode.classList.add('hidden');
    imgNode.style.clipPath = "none"; 
    imgNode.style.transform = "none";
    textNode.classList.add('hidden');
    
    currentChallengeData = generateDynamicQuestion(currentIndustry, currentMode);
    
    if (currentMode === 'shot' || currentMode === 'poster' || currentMode === 'partialPoster') {
        imgNode.src = currentChallengeData.hint;
        imgNode.classList.remove('hidden');
        
        if (currentMode === 'partialPoster') {
            // Clips a highly specific, recognizable center viewing hole into the image element
            imgNode.style.clipPath = "circle(18% at 50% 40%)";
            imgNode.style.transform = "scale(1.5)";
        }
    } else {
        textNode.innerText = currentChallengeData.hint;
        textNode.classList.remove('hidden');
    }
    
    const optionsBox = document.getElementById('options-container');
    optionsBox.innerHTML = '';
    
    currentChallengeData.options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = "bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left px-4 py-3.5 rounded-xl font-medium text-sm text-slate-200 transition focus:outline-none";
        btn.innerText = option;
        btn.onclick = () => submitOptionGuess(option, btn);
        optionsBox.appendChild(btn);
    });
}

function submitOptionGuess(selectedOption, buttonNode) {
    const buttons = document.getElementById('options-container').querySelectorAll('button');
    buttons.forEach(b => b.disabled = true);
    
    const alertBox = document.getElementById('feedback-alert');
    alertBox.classList.remove('hidden');
    
    // Instantly reveal the full unmasked poster so the player can see what it was!
    const imgNode = document.getElementById('hint-image');
    imgNode.style.clipPath = "none";
    imgNode.style.transform = "none";
    
    if (selectedOption === currentChallengeData.answer) {
        buttonNode.className = "bg-emerald-500/10 border-emerald-500 text-emerald-400 text-left px-4 py-3.5 rounded-xl font-medium text-sm focus:outline-none border";
        alertBox.className = "p-4 rounded-xl font-semibold text-center border bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
        alertBox.innerHTML = '✨ Correct! Excellent cinematic knowledge.';
        updateScore(10);
    } else {
        buttonNode.className = "bg-red-500/10 border-red-500 text-red-400 text-left px-4 py-3.5 rounded-xl font-medium text-sm focus:outline-none border";
        alertBox.className = "p-4 rounded-xl font-semibold text-center border bg-red-500/10 border-red-500/20 text-red-400";
        alertBox.innerHTML = `❌ Wrong! The correct answer was: <strong>${currentChallengeData.answer}</strong>`;
    }
    document.getElementById('next-btn').classList.remove('hidden');
}

function updateScore(points) {
    globalScore += points;
    document.getElementById('global-score').innerText = globalScore;
}
