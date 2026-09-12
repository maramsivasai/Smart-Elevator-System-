(function(){
  const TOTAL_FLOORS = 10;
  const GROUND_FLOOR = 1;
  const CAPACITY = 5;
  const STEP_MS = 700;
  const ROW_H = 42;

  const shaft = document.getElementById('shaft');
  const car = document.getElementById('car');
  const carLabel = document.getElementById('carLabel');
  const floorDigit = document.getElementById('floorDigit');
  const floorMeta = document.getElementById('floorMeta');
  const stateDot = document.getElementById('stateDot');
  const stateLabel = document.getElementById('stateLabel');
  const fromSelect = document.getElementById('fromSelect');
  const toSelect = document.getElementById('toSelect');
  const callTripBtn = document.getElementById('callTripBtn');
  const tripError = document.getElementById('tripError');
  const queueList = document.getElementById('queueList');
  const pendingCount = document.getElementById('pendingCount');
  const onboardCount = document.getElementById('onboardCount');
  const logEl = document.getElementById('log');

  const statStops = document.getElementById('statStops');
  const statMovement = document.getElementById('statMovement');
  const statTripTime = document.getElementById('statTripTime');
  const statRuntime = document.getElementById('statRuntime');
  const statOnboard = document.getElementById('statOnboard');

  let state = {};

  function pad(n){ return n < 10 ? '0' + n : '' + n; }

  function freshState(){
    return {
      currentFloor: GROUND_FLOOR,
      direction: 'idle',         // 'up' | 'down' | 'idle'
      totalMovement: 0,
      stopsMade: 0,
      totalTripTime: 0,
      tripsCompleted: 0,
      startTime: Date.now(),
      pending: [],   // { id, from, to, dir, requestTime }
      onboard: [],   // { id, from, to, dir, requestTime, pickupTime }
      nextTripId: 1,
      busy: false,
      rows: []
    };
  }

  function buildShaft(){
    shaft.querySelectorAll('.floor-row').forEach(r => r.remove());
    state.rows = [];
    for(let f = TOTAL_FLOORS; f >= GROUND_FLOOR; f--){
      const row = document.createElement('div');
      row.className = 'floor-row';
      row.dataset.floor = f;
      row.innerHTML = `<span class="fnum">${pad(f)}</span><span class="callmarks"><span class="call-up" data-floor="${f}">&#9650;</span><span class="call-down" data-floor="${f}">&#9660;</span></span><span class="track"></span>`;
      shaft.appendChild(row);
      state.rows[f] = row;
    }
    shaft.style.height = (TOTAL_FLOORS * ROW_H) + 'px';
  }

  function buildFloorSelects(){
    [fromSelect, toSelect].forEach(sel => {
      sel.innerHTML = '';
      for(let f = 1; f <= TOTAL_FLOORS; f++){
        const opt = document.createElement('option');
        opt.value = f;
        opt.textContent = 'Floor ' + f;
        sel.appendChild(opt);
      }
    });
    fromSelect.value = 1;
    toSelect.value = 2;
  }

  function log(msg, cls){
    const line = document.createElement('div');
    if(cls) line.className = cls;
    const t = ((Date.now() - state.startTime)/1000).toFixed(1);
    line.textContent = `[${t}s] ${msg}`;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function carTopFor(floor){
    return (TOTAL_FLOORS - floor) * ROW_H + 4;
  }

  function refreshCarLabel(){
    const n = state.onboard.length;
    car.classList.toggle('occupied', n > 0);
    car.classList.toggle('full', n >= CAPACITY);
    if(n === 0){
      carLabel.textContent = 'EMPTY';
    } else {
      const dests = [...new Set(state.onboard.map(p => p.to))].sort((a,b)=>a-b).join(',');
      const arrow = state.direction === 'up' ? '\u21E7' : state.direction === 'down' ? '\u21E9' : '';
      carLabel.textContent = `${n}/${CAPACITY} ${arrow} ${dests}`;
    }
  }

  function refreshCallMarks(){
    for(let f = GROUND_FLOOR; f <= TOTAL_FLOORS; f++){
      const row = state.rows[f];
      if(!row) continue;
      const up = row.querySelector('.call-up');
      const down = row.querySelector('.call-down');
      const hasUp = state.pending.some(r => r.from === f && r.dir === 'up');
      const hasDown = state.pending.some(r => r.from === f && r.dir === 'down');
      up.classList.toggle('active', hasUp);
      down.classList.toggle('active', hasDown);
    }
  }

  function refreshQueueList(){
    queueList.innerHTML = '';
    const waiting = state.pending;
    const onboard = state.onboard;

    if(waiting.length === 0 && onboard.length === 0){
      const empty = document.createElement('div');
      empty.className = 'queue-empty';
      empty.textContent = 'No pending requests.';
      queueList.appendChild(empty);
    } else {
      waiting.forEach(r => {
        const waited = ((Date.now() - r.requestTime)/1000).toFixed(1);
        const arrow = r.dir === 'up' ? '\u2191' : '\u2193';
        const li = document.createElement('li');
        li.innerHTML = `<span>${arrow} Floor ${r.from} \u2192 Floor ${r.to}</span><span>waiting ${waited}s</span>`;
        queueList.appendChild(li);
      });
      onboard.forEach(p => {
        const onboardSecs = ((Date.now() - p.pickupTime)/1000).toFixed(1);
        const li = document.createElement('li');
        li.className = 'onboard';
        li.innerHTML = `<span>Onboard \u2192 Floor ${p.to}</span><span>${onboardSecs}s in lift</span>`;
        queueList.appendChild(li);
      });
    }
    pendingCount.textContent = waiting.length + ' waiting';
    onboardCount.textContent = onboard.length + '/' + CAPACITY + ' onboard';
  }

  function refreshReadout(){
    floorDigit.textContent = pad(state.currentFloor);
    floorMeta.textContent = `Floor ${state.currentFloor} of ${TOTAL_FLOORS}`;
  }

  function setBusy(busy){
    state.busy = busy;
    stateDot.classList.toggle('busy', busy);
    stateDot.classList.toggle('idle', !busy);
    if(busy){
      stateLabel.textContent = state.direction === 'up' ? 'MOVING \u21E7' : state.direction === 'down' ? 'MOVING \u21E9' : 'MOVING';
    } else {
      stateLabel.textContent = 'IDLE';
    }
  }

  function refreshStats(){
    statStops.textContent = state.stopsMade;
    statMovement.textContent = state.totalMovement + ' floors';
    const avgMs = state.tripsCompleted > 0 ? state.totalTripTime / state.tripsCompleted : 0;
    statTripTime.textContent = (avgMs/1000).toFixed(1) + 's';
    statOnboard.textContent = state.onboard.length + '/' + CAPACITY;
  }

  function tickRuntime(){
    statRuntime.textContent = ((Date.now() - state.startTime)/1000).toFixed(1) + 's';
  }

  function requestTrip(from, to){
    tripError.textContent = '';
    if(from === to){
      tripError.textContent = 'Pickup and destination must be different floors.';
      return;
    }
    const id = state.nextTripId++;
    const dir = to > from ? 'up' : 'down';
    state.pending.push({ id, from, to, dir, requestTime: Date.now(), pickupTime: null });
    log(`Trip requested: Floor ${from} \u2192 Floor ${to} (${dir})`, 'ok');
    refreshQueueList();
    refreshCallMarks();
    autoLoop();
  }

  function clearRowClasses(){
    for(let f = GROUND_FLOOR; f <= TOTAL_FLOORS; f++){
      state.rows[f].classList.remove('lit', 'arrived');
    }
  }

  // --- SCAN core ---

  // Pick an initial direction when the car is idle and new work exists.
  function chooseInitialDirection(){
    const candidateFloors = [];
    state.onboard.forEach(p => candidateFloors.push(p.to));
    state.pending.forEach(r => candidateFloors.push(r.from));
    if(candidateFloors.length === 0){
      state.direction = 'idle';
      return;
    }
    let nearest = candidateFloors[0];
    candidateFloors.forEach(f => {
      if(Math.abs(f - state.currentFloor) < Math.abs(nearest - state.currentFloor)) nearest = f;
    });
    if(nearest === state.currentFloor){
      const reqHere = state.pending.find(r => r.from === state.currentFloor);
      state.direction = reqHere ? reqHere.dir : 'up';
    } else {
      state.direction = nearest > state.currentFloor ? 'up' : 'down';
    }
  }

  // Nearest floor the lift should visit next if travelling in `dir`, or null if nothing ahead.
  // Any pending request's origin floor, or any onboard passenger's destination floor, counts
  // as a stop in that direction — we don't care which way the *caller* eventually wants to
  // go, only whether their floor lies ahead of us right now (classic SCAN/elevator-arm sweep).
  function nextStopInDirection(dir){
    const candidates = new Set();
    state.onboard.forEach(p => {
      if(dir === 'up' && p.to >= state.currentFloor) candidates.add(p.to);
      if(dir === 'down' && p.to <= state.currentFloor) candidates.add(p.to);
    });
    if(state.onboard.length < CAPACITY){
      state.pending.forEach(r => {
        if(dir === 'up' && r.from >= state.currentFloor) candidates.add(r.from);
        if(dir === 'down' && r.from <= state.currentFloor) candidates.add(r.from);
      });
    }
    if(candidates.size === 0) return null;
    const arr = [...candidates];
    return dir === 'up' ? Math.min(...arr) : Math.max(...arr);
  }

  function arriveAtFloor(floor){
    state.stopsMade += 1;

    const dropping = state.onboard.filter(p => p.to === floor);
    if(dropping.length){
      dropping.forEach(p => {
        const tripTime = Date.now() - p.requestTime;
        state.totalTripTime += tripTime;
        state.tripsCompleted += 1;
        log(`Dropped off passenger at Floor ${floor} \u00b7 trip took ${(tripTime/1000).toFixed(1)}s`, 'ok');
      });
      state.onboard = state.onboard.filter(p => p.to !== floor);
    }

    const room = CAPACITY - state.onboard.length;
    if(room > 0){
      const matching = state.pending.filter(r => r.from === floor);
      const boarding = matching.slice(0, room);
      boarding.forEach(r => {
        r.pickupTime = Date.now();
        state.onboard.push(r);
      });
      if(boarding.length){
        const boardedIds = new Set(boarding.map(b => b.id));
        state.pending = state.pending.filter(r => !boardedIds.has(r.id));
        log(`Picked up ${boarding.length} passenger(s) at Floor ${floor} \u2192 ${boarding.map(b=>b.to).join(', ')} (${state.onboard.length}/${CAPACITY} onboard)`, 'ok');
      }
      if(matching.length > boarding.length){
        log(`Lift full \u2014 ${matching.length - boarding.length} passenger(s) still waiting at Floor ${floor}`, 'info');
      }
    }

    refreshCarLabel();
    refreshStats();
    refreshQueueList();
    refreshCallMarks();
  }

  function travelTo(target, onDone){
    const from = state.currentFloor;

    if(from === target){
      log(`Already at Floor ${target}. Servicing in place.`, 'info');
      arriveAtFloor(target);
      if(onDone) onDone();
      return;
    }

    setBusy(true);
    log(`Moving ${state.direction === 'up' ? 'up' : 'down'} from Floor ${from} toward Floor ${target}`, 'move');

    const dir = target > from ? 1 : -1;
    let f = from;

    const timer = setInterval(() => {
      f += dir;
      car.style.top = carTopFor(f) + 'px';
      clearRowClasses();
      state.rows[f].classList.add('lit');
      log(`${dir > 0 ? '\u2B06' : '\u2B07'} Floor ${f}`, 'move');

      if(f === target){
        clearInterval(timer);
        state.currentFloor = target;
        state.totalMovement += Math.abs(target - from);

        state.rows[f].classList.remove('lit');
        state.rows[f].classList.add('arrived');

        refreshReadout();
        arriveAtFloor(target);

        setTimeout(() => {
          setBusy(false);
          if(onDone) onDone();
        }, 200);
      }
    }, STEP_MS);
  }

  function dispatchNext(onDone){
    if(state.busy) return;

    if(state.pending.length === 0 && state.onboard.length === 0){
      state.direction = 'idle';
      if(onDone) onDone();
      return;
    }

    if(state.direction === 'idle'){
      chooseInitialDirection();
    }

    let target = nextStopInDirection(state.direction);

    if(target === null){
      const reversed = state.direction === 'up' ? 'down' : 'up';
      target = nextStopInDirection(reversed);
      if(target !== null){
        state.direction = reversed;
        log(`No more stops ahead \u2014 reversing direction to ${reversed.toUpperCase()}`, 'info');
      }
    }

    if(target === null){
      // Nothing reachable right now (e.g. remaining requests are behind us in
      // both directions) — flip direction anyway so we sweep back through them.
      state.direction = state.direction === 'up' ? 'down' : 'up';
      if(onDone) onDone();
      return;
    }

    travelTo(target, onDone);
  }

  // Runs continuously in real time: as long as there's work, keep dispatching;
  // each arrival automatically chains into the next stop with no user input.
  let loopScheduled = false;
  function autoLoop(){
    if(state.busy || loopScheduled) return;
    if(state.pending.length === 0 && state.onboard.length === 0){
      state.direction = 'idle';
      setBusy(false);
      return;
    }
    loopScheduled = true;
    setTimeout(() => {
      loopScheduled = false;
      dispatchNext(autoLoop);
    }, 120);
  }

  function reset(){
    state = freshState();
    logEl.innerHTML = '';
    tripError.textContent = '';
    buildShaft();
    car.style.transition = 'none';
    car.style.top = carTopFor(GROUND_FLOOR) + 'px';
    requestAnimationFrame(() => { car.style.transition = ''; });
    refreshCarLabel();
    refreshQueueList();
    refreshReadout();
    refreshStats();
    refreshCallMarks();
    setBusy(false);
    log(`System ready. Lift at Floor 1. SCAN dispatch, capacity ${CAPACITY}.`, 'info');
  }

  callTripBtn.addEventListener('click', () => {
    requestTrip(parseInt(fromSelect.value, 10), parseInt(toSelect.value, 10));
  });

  buildFloorSelects();
  reset();

  setInterval(() => { tickRuntime(); refreshQueueList(); }, 500);
})();
