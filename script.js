(() => {
  'use strict';

  // DOM elements for panels and tabs
  const adminTab = document.getElementById('admin-tab');
  const userTab = document.getElementById('user-tab');
  const adminPanel = document.getElementById('admin-panel');
  const userPanel = document.getElementById('user-panel');

  // Switch between Admin and User views
  function switchTab(toAdmin) {
    if (toAdmin) {
      adminTab.setAttribute('aria-selected', 'true');
      adminTab.tabIndex = 0;
      userTab.setAttribute('aria-selected', 'false');
      userTab.tabIndex = -1;
      adminPanel.hidden = false;
      userPanel.hidden = true;
      adminPanel.focus();
    } else {
      adminTab.setAttribute('aria-selected', 'false');
      adminTab.tabIndex = -1;
      userTab.setAttribute('aria-selected', 'true');
      userTab.tabIndex = 0;
      adminPanel.hidden = true;
      userPanel.hidden = false;
      userPanel.focus();
    }
  }

  adminTab.addEventListener('click', () => switchTab(true));
  userTab.addEventListener('click', () => switchTab(false));

  // Initial tab state
  switchTab(true);

  // Poll creation form elements
  const pollForm = document.getElementById('poll-creation-form');
  const questionInput = document.getElementById('poll-question-input');
  const optionsList = document.getElementById('options-list');
  const addOptionBtn = pollForm.querySelector('.add-option');
  const durationInput = document.getElementById('poll-duration-input');
  const launchPollBtn = document.getElementById('launch-poll-btn');

  // Active poll display elements (Admin)
  const activePollSection = document.getElementById('active-poll-section');
  const sessionCodeDisplay = document.getElementById('session-code-display');
  const activePollQuestion = document.getElementById('active-poll-question');
  const pollTimer = document.getElementById('poll-timer');
  const barChartSvg = activePollSection.querySelector('.bar-chart');
  const pieChartSvg = activePollSection.querySelector('.pie-chart');

  // Session history
  const historyList = document.getElementById('session-history-list');

  // User panel elements
  const joinSessionForm = document.getElementById('join-session-form');
  const sessionCodeInput = document.getElementById('session-code-input');
  const joinSessionBtn = document.getElementById('join-session-btn');
  const userPollSection = document.getElementById('user-poll-section');
  const userPollQuestion = document.getElementById('user-poll-question');
  const userOptionsFieldset = document.getElementById('user-options-fieldset');
  const userPollForm = document.getElementById('user-poll-form');
  const submitVoteBtn = document.getElementById('submit-vote-btn');
  const voteConfirmation = document.getElementById('vote-confirmation');
  const joinError = document.getElementById('join-error');

  // State variables
  let pollOptions = [];
  let pollVotes = {};
  let sessionCode = null;
  let pollQuestion = '';
  let pollDuration = 60;
  let pollEndTime = null;
  let pollTimerInterval = null;
  let pollActive = false;

  // Session history array - stores previous poll sessions
  let sessionHistory = [];

  // Utility: generate random 6-letter session code
  function generateSessionCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Utility: create initial empty options inputs (min 2)
  function addOptionInput(value = '') {
    const optionWrapper = document.createElement('div');
    optionWrapper.className = 'option-item';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Option text';
    input.value = value;
    input.required = true;
    input.autocomplete = 'off';
    input.minLength = 1;
    input.maxLength = 100;
    input.setAttribute('aria-label', 'Poll option text');
    optionWrapper.appendChild(input);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '×';
    removeBtn.title = 'Remove option';
    removeBtn.style = 'background:none; border:none; cursor:pointer; font-size: 1.5rem; color:#ef4444;';
    removeBtn.setAttribute('aria-label', 'Remove this option');
    removeBtn.addEventListener('click', () => {
      optionsList.removeChild(optionWrapper);
      validatePollForm();
    });
    optionWrapper.appendChild(removeBtn);

    optionsList.appendChild(optionWrapper);

    input.addEventListener('input', validatePollForm);
    validatePollForm();
  }

  // Initialize with 2 option inputs
  addOptionInput();
  addOptionInput();

  addOptionBtn.addEventListener('click', () => {
    addOptionInput();
  });

  // Enable/disable Launch button based on valid input
  function validatePollForm() {
    const questionValid = questionInput.value.trim().length > 0;
    const options = getPollOptions();
    const optionsValid = options.length >= 2 && options.every(opt => opt.trim().length > 0);
    const durationValid = durationInput.value && +durationInput.value >= 10 && +durationInput.value <= 300;
    launchPollBtn.disabled = !(questionValid && optionsValid && durationValid);
  }

  // Get options text array from inputs
  function getPollOptions() {
    const inputs = optionsList.querySelectorAll('input[type="text"]');
    return Array.from(inputs).map(input => input.value.trim());
  }

  // Launch poll event
  pollForm.addEventListener('submit', e => {
    e.preventDefault();
    if (pollActive) return;
    pollQuestion = questionInput.value.trim();
    pollOptions = getPollOptions();
    pollVotes = {};
    pollOptions.forEach(opt => (pollVotes[opt] = 0));
    pollDuration = Math.max(10, Math.min(300, +durationInput.value));
    sessionCode = generateSessionCode();
    pollEndTime = Date.now() + pollDuration * 1000;
    pollActive = true;

    // Show active poll section with details
    sessionCodeDisplay.textContent = sessionCode;
    activePollQuestion.textContent = pollQuestion;
    launchPollBtn.disabled = true;
    pollForm.querySelectorAll('input, button').forEach(el => el.disabled = true);
    activePollSection.style.display = 'block';
    joinError.style.display = 'none';

    renderResults();
    startTimer();

    // Add session to history after poll ends (done in timer)
  });

  // Timer countdown and poll finishing
  function startTimer() {
    updateTimer();
    pollTimerInterval = setInterval(() => {
      updateTimer();
    }, 500);
  }

  function updateTimer() {
    const now = Date.now();
    const remainingMs = pollEndTime - now;
    if (remainingMs <= 0) {
      pollTimer.textContent = 'Poll ended';
      clearInterval(pollTimerInterval);
      pollActive = false;
      finishPoll();
    } else {
      const seconds = Math.ceil(remainingMs / 1000);
      pollTimer.textContent = `Time left: ${seconds}s`;
    }
  }

  function finishPoll() {
    // Enable creating new poll form
    pollForm.querySelectorAll('input, button').forEach(el => el.disabled = false);
    launchPollBtn.disabled = true;

    // Add current poll to session history
    sessionHistory.unshift({
      code: sessionCode,
      question: pollQuestion,
      options: [...pollOptions],
      votes: {...pollVotes},
      duration: pollDuration,
      timestamp: new Date(),
    });

    renderSessionHistory();

    // Reset active poll variables to allow creating new poll
    sessionCode = null;
    pollQuestion = '';
    pollOptions = [];
    pollVotes = {};
    pollEndTime = null;
  }

  // Render live results on charts
  function renderResults() {
    renderBarChart();
    renderPieChart();
  }

  // Render bar chart in SVG
  function renderBarChart() {
    while (barChartSvg.firstChild) {
      barChartSvg.removeChild(barChartSvg.firstChild);
    }

    const svgWidth = 700;
    const svgHeight = 250;
    const margin = 40;
    const barWidth = 40;
    const gap = 30;

    const optionsCount = pollOptions.length;
    if (optionsCount === 0) return;

    const maxVotes = Math.max(...Object.values(pollVotes), 1);
    const scaleY = (svgHeight - margin * 2) / maxVotes;

    pollOptions.forEach((option, i) => {
      const votes = pollVotes[option] || 0;
      const barHeight = votes * scaleY;
      const x = margin + i * (barWidth + gap);
      const y = svgHeight - margin - barHeight;

      // Bar rect
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', barWidth);
      rect.setAttribute('height', barHeight);
      rect.setAttribute('class', 'bar');
      barChartSvg.appendChild(rect);

      // Option label (below bar)
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', x + barWidth / 2);
      label.setAttribute('y', svgHeight - margin + 20);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('class', 'bar-label');
      label.textContent = option;
      barChartSvg.appendChild(label);

      // Vote count (above bar)
      const value = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      value.setAttribute('x', x + barWidth / 2);
      value.setAttribute('y', y - 5);
      value.setAttribute('text-anchor', 'middle');
      value.setAttribute('class', 'bar-value');
      value.textContent = votes;
      barChartSvg.appendChild(value);
    });
  }

  // Render pie chart using SVG circle slices
  function renderPieChart() {
    while (pieChartSvg.firstChild) {
      pieChartSvg.removeChild(pieChartSvg.firstChild);
    }
    const cx = 125;
    const cy = 125;
    const radius = 100;

    const totalVotes = Object.values(pollVotes).reduce((a,b) => a+b, 0) || 1;

    let startAngle = 0;
    pollOptions.forEach((option, i) => {
      const votes = pollVotes[option] || 0;
      const sliceAngle = (votes / totalVotes) * 2 * Math.PI;

      const x1 = cx + radius * Math.cos(startAngle);
      const y1 = cy + radius * Math.sin(startAngle);
      const x2 = cx + radius * Math.cos(startAngle + sliceAngle);
      const y2 = cy + radius * Math.sin(startAngle + sliceAngle);

      const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

      if (votes > 0) {
        const pathData = [
          `M ${cx} ${cy}`,
          `L ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          'Z'
        ].join(' ');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('class', 'slice');
        path.setAttribute('fill', 'var(--color-accent)');
        path.style.opacity = 0.8 - (i * 0.1);
        path.title = option + ': ' + votes + ' vote' + (votes !== 1 ? 's' : '');
        pieChartSvg.appendChild(path);
      }
      startAngle += sliceAngle;
    });

    // If no votes yet, show circle outline
    if (totalVotes === 0) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', radius);
      circle.setAttribute('stroke', 'var(--color-accent)');
      circle.setAttribute('stroke-width', 4);
      circle.setAttribute('fill', 'none');
      pieChartSvg.appendChild(circle);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', cx);
      text.setAttribute('y', cy);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('alignment-baseline', 'middle');
      text.setAttribute('fill', 'var(--color-accent)');
      text.setAttribute('font-size', '16');
      text.textContent = 'No votes yet';
      pieChartSvg.appendChild(text);
    }
  }

  // Render session history list
  function renderSessionHistory() {
    historyList.innerHTML = '';
    if (sessionHistory.length === 0) {
      const p = document.createElement('p');
      p.textContent = 'No previous sessions yet.';
      historyList.appendChild(p);
      return;
    }

    sessionHistory.forEach(session => {
      const div = document.createElement('div');
      div.className = 'history-item';

      const tsFormatted = session.timestamp.toLocaleString();

      const title = document.createElement('h3');
      title.textContent = `Session ${session.code} - ${tsFormatted}`;
      div.appendChild(title);

      const questionPara = document.createElement('p');
      questionPara.textContent = session.question;
      questionPara.style.fontWeight = '600';
      div.appendChild(questionPara);

      // Show simple bar results
      const ul = document.createElement('ul');
      ul.style.listStyle = 'none';
      ul.style.paddingLeft = 0;
      session.options.forEach(opt => {
        const li = document.createElement('li');
        li.textContent = `${opt}: ${session.votes[opt] || 0} vote${(session.votes[opt] || 0) !== 1 ? 's' : ''}`;
        ul.appendChild(li);
      });
      div.appendChild(ul);

      historyList.appendChild(div);
    });
  }

  // User join session form validation and enable join button
  sessionCodeInput.addEventListener('input', () => {
    const val = sessionCodeInput.value.trim().toUpperCase();
    sessionCodeInput.value = val;
    joinSessionBtn.disabled = val.length !== 6;
    joinError.style.display = 'none';
  });

  // Join session form submit
  joinSessionForm.addEventListener('submit', e => {
    e.preventDefault();
    const code = sessionCodeInput.value.trim().toUpperCase();

    if (!pollActive || code !== sessionCode) {
      joinError.style.display = 'block';
      userPollSection.style.display = 'none';
      voteConfirmation.style.display = 'none';
      return;
    }
    joinError.style.display = 'none';

    // Show poll question and options to user
    userPollQuestion.textContent = pollQuestion;
    // Clear prior options
    userOptionsFieldset.innerHTML = '';

    pollOptions.forEach((option, i) => {
      const radioId = 'user-option-' + i;

      const label = document.createElement('label');
      label.setAttribute('for', radioId);
      label.style.display = 'block';
      label.style.marginBottom = '0.5rem';
      label.style.cursor = 'pointer';

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'user-poll-option';
      radio.id = radioId;
      radio.value = option;
      radio.required = true;
      radio.style.marginRight = '0.5rem';

      radio.addEventListener('change', () => {
        submitVoteBtn.disabled = false;
      });

      label.appendChild(radio);
      label.appendChild(document.createTextNode(option));
      userOptionsFieldset.appendChild(label);
    });

    userPollSection.style.display = 'block';
    submitVoteBtn.disabled = true;
    voteConfirmation.style.display = 'none';
  });

  // User submits vote
  userPollForm.addEventListener('submit', e => {
    e.preventDefault();

    if (!pollActive) return;

    const formData = new FormData(userPollForm);
    const selectedOption = formData.get('user-poll-option');

    if (!selectedOption || !pollVotes.hasOwnProperty(selectedOption)) {
      return;
    }

    // Update votes
    pollVotes[selectedOption]++;
    renderResults();

    // Disable inputs after vote
    userPollForm.querySelectorAll('input').forEach(el => el.disabled = true);
    submitVoteBtn.disabled = true;

    voteConfirmation.style.display = 'block';
  });

  // Disable launch poll if inputs invalid
  questionInput.addEventListener('input', validatePollForm);
  durationInput.addEventListener('input', validatePollForm);

})();
