document.addEventListener('DOMContentLoaded', () => {
  const textInput = document.getElementById('textInput');
  const btnAnalyze = document.getElementById('btnAnalyze');
  const btnClear = document.getElementById('btnClear');
  const btnSamplePos = document.getElementById('btnSamplePos');
  const btnSampleNeg = document.getElementById('btnSampleNeg');
  const btnSampleNeu = document.getElementById('btnSampleNeu');
  const toast = document.getElementById('toast');

  const resultsSection = document.getElementById('resultsSection');
  const sentimentBanner = document.getElementById('sentimentBanner');
  const sentimentIcon = document.getElementById('sentimentIcon');
  const sentimentLabel = document.getElementById('sentimentLabel');
  const sentimentDesc = document.getElementById('sentimentDesc');
  const scoreBadge = document.getElementById('scoreBadge');
  const influentialWords = document.getElementById('influentialWords');

  // Curated AFINN / VADER-inspired rule-based sentiment lexicon (-5 to +5)
  const LEXICON = {
    // Strongly Positive
    'outstanding': 5, 'superb': 5, 'flawless': 5, 'magnificent': 4, 'excellent': 4,
    'amazing': 4, 'wonderful': 4, 'fantastic': 4, 'brilliant': 4, 'perfect': 4,
    'great': 3, 'love': 3, 'happy': 3, 'best': 3, 'beautiful': 3, 'joyful': 3,
    'delighted': 4, 'thrilled': 4, 'success': 3, 'successful': 3, 'win': 3,
    'impressive': 3, 'awesome': 3, 'good': 2, 'pleasant': 2, 'friendly': 2,
    'helpful': 2, 'enjoy': 2, 'enjoyed': 2, 'clean': 2, 'smart': 2, 'nice': 2,
    'fine': 1, 'cool': 1, 'easy': 1, 'like': 1, 'liked': 1,

    // Strongly Negative
    'catastrophic': -5, 'disaster': -5, 'atrocious': -5, 'terrible': -4, 'horrible': -4,
    'awful': -4, 'dreadful': -4, 'worst': -4, 'hate': -3, 'hated': -3, 'painful': -3,
    'useless': -3, 'disappointed': -3, 'disappointing': -3, 'frustrating': -3,
    'bad': -2, 'poor': -2, 'sad': -2, 'angry': -3, 'fail': -2, 'failed': -2,
    'failure': -3, 'broken': -2, 'difficult': -2, 'error': -2, 'problem': -2,
    'annoying': -2, 'annoyed': -2, 'ugly': -2, 'rude': -2, 'slow': -1, 'boring': -2
  };

  const NEGATIONS = new Set([
    'not', 'no', 'never', 'hardly', 'barely', 'scarcely', 'without', 'isn\'t',
    'aren\'t', 'wasn\'t', 'weren\'t', 'don\'t', 'doesn\'t', 'didn\'t', 'won\'t',
    'wouldn\'t', 'can\'t', 'cannot', 'couldn\'t'
  ]);

  const INTENSIFIERS = new Set([
    'very', 'extremely', 'really', 'so', 'totally', 'absolutely', 'incredibly', 'super'
  ]);

  function showToast(message, isError = false) {
    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.background = isError ? '#991b1b' : '#065f46';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 2500);
  }

  function analyzeSentiment() {
    const rawText = textInput.value.trim();
    if (!rawText) {
      showToast('Please enter text to analyze sentiment.', true);
      resultsSection.style.display = 'none';
      return;
    }

    const words = rawText.toLowerCase().match(/\b[a-z0-9'’-]+\b/g) || [];
    if (words.length === 0) {
      showToast('No recognizable words found in the text.', true);
      return;
    }

    let totalScore = 0;
    const detected = [];

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (LEXICON.hasOwnProperty(w)) {
        let val = LEXICON[w];
        let isNegated = false;
        let isIntensified = false;

        if (i > 0 && NEGATIONS.has(words[i - 1])) isNegated = true;
        else if (i > 1 && NEGATIONS.has(words[i - 2])) isNegated = true;

        if (i > 0 && INTENSIFIERS.has(words[i - 1])) isIntensified = true;

        if (isIntensified) val *= 1.5;
        if (isNegated) val *= -1.0;

        totalScore += val;

        const displayName = isNegated ? `not ${w}` : (isIntensified ? `very ${w}` : w);
        detected.push({
          word: displayName,
          score: val,
          isPos: val > 0
        });
      }
    }

    // Normalized compound score between -1.0 and +1.0
    const alpha = 15;
    const normalized = totalScore === 0 ? 0 : totalScore / Math.sqrt((totalScore * totalScore) + alpha);
    const scoreStr = (normalized >= 0 ? '+' : '') + normalized.toFixed(2);

    let classification = 'Neutral';
    let icon = '😐';
    let bannerClass = 'neutral';
    let desc = 'The overall tone of the text is balanced, neutral, or objective.';

    if (normalized > 0.05) {
      classification = 'Positive';
      icon = '😊';
      bannerClass = 'positive';
      desc = 'The text expresses favorable, happy, or constructive sentiment.';
    } else if (normalized < -0.05) {
      classification = 'Negative';
      icon = '🙁';
      bannerClass = 'negative';
      desc = 'The text expresses dissatisfaction, criticism, or negative emotions.';
    }

    sentimentBanner.className = `sentiment-banner ${bannerClass}`;
    sentimentIcon.textContent = icon;
    sentimentLabel.textContent = classification;
    sentimentDesc.textContent = desc;
    scoreBadge.textContent = `Score: ${scoreStr}`;

    // Render Influential Words
    influentialWords.innerHTML = '';
    if (detected.length === 0) {
      influentialWords.innerHTML = '<span style="color:#64748b; font-style:italic;">No explicitly polarized keywords detected; classified using neutral baseline.</span>';
    } else {
      detected.forEach(item => {
        const pill = document.createElement('span');
        pill.className = `word-pill ${item.isPos ? 'pos' : 'neg'}`;
        pill.textContent = `${item.word} (${item.score > 0 ? '+' : ''}${item.score})`;
        influentialWords.appendChild(pill);
      });
    }

    resultsSection.style.display = 'block';
    showToast(`Classified as ${classification} (Score: ${scoreStr})`);
  }

  btnAnalyze.addEventListener('click', analyzeSentiment);

  btnClear.addEventListener('click', () => {
    textInput.value = '';
    resultsSection.style.display = 'none';
    showToast('Input cleared.');
  });

  btnSamplePos.addEventListener('click', () => {
    textInput.value = 'We had an outstanding and wonderful experience with this product! The team is friendly and the software is clean, fast, and easy to use.';
    analyzeSentiment();
  });

  btnSampleNeg.addEventListener('click', () => {
    textInput.value = 'The delivery was terrible and completely disappointing. The package arrived broken, the customer service was rude, and the product is useless.';
    analyzeSentiment();
  });

  btnSampleNeu.addEventListener('click', () => {
    textInput.value = 'The shipment arrived on Thursday morning. The brown box contained three standard user manuals and two replacement cables.';
    analyzeSentiment();
  });
});
