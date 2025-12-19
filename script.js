  const API_KEY = "628faa92e78a420996a42351250109"; // Provided by you
    const BASE = "https://api.weatherapi.com/v1/forecast.json"; // safer than http

    // ====== ELEMENTS ======
    const el = (id) => document.getElementById(id);
    const input = el('locationInput');
    const goBtn = el('goBtn');
    const locBtn = el('locBtn');
    const statusEl = el('status');
    const unitToggle = el('unitToggle');

    const city = el('city').querySelector('strong');
    const localtime = el('localtime');
    const icon = el('icon');
    const temp = el('temp');
    const cond = el('cond');
    const feels = el('feels');
    const hiLo = el('hiLo');
    const humidity = el('humidity');
    const wind = el('wind');
    const aqi = el('aqi');
    const alerts = el('alerts');

    // ====== HELPERS ======
    const show = (el) => el.classList.remove('hidden');
    const hide = (el) => el.classList.add('hidden');

    function setStatus(msg, type = 'info') {
      statusEl.textContent = msg;
      statusEl.style.color = type === 'error' ? 'var(--danger)' : 'var(--muted)';
      show(statusEl);
    }

    function clearStatus() { hide(statusEl); }

    function cToF(c) { return (c * 9/5) + 32; }
    function formatTemp(c) {
      return unitToggle.checked ? `${Math.round(cToF(c))}°F` : `${Math.round(c)}°C`;
    }

    function formatWind(kph) {
      const mph = kph * 0.621371;
      return unitToggle.checked ? `${mph.toFixed(1)} mph` : `${kph.toFixed(1)} km/h`;
    }

    function buildUrl(q) {
      const params = new URLSearchParams({ key: API_KEY, q, days: '1', aqi: 'yes', alerts: 'yes' });
      return `${BASE}?${params.toString()}`;
    }

    async function fetchWeather(q) {
      try {
        setStatus('Fetching weather…');
        goBtn.disabled = true;
        goBtn.innerHTML = '<span class="spinner"></span>';

        const res = await fetch(buildUrl(q));
        if (!res.ok) {
          const t = await res.text();
          throw new Error(`HTTP ${res.status}: ${t || res.statusText}`);
        }
        const data = await res.json();
        render(data);
        clearStatus();
      } catch (err) {
        console.error(err);
        setStatus(err.message.includes('API') ? err.message : 'Could not fetch weather. Check the location and try again.', 'error');
      } finally {
        goBtn.disabled = false;
        goBtn.textContent = 'Get weather';
      }
    }

    function render(d) {
      const loc = d.location;
      const cur = d.current;
      const day = d.forecast?.forecastday?.[0]?.day;

      city.textContent = `${loc.name}, ${loc.region || loc.country}`;
      localtime.textContent = `${loc.localtime}`;

      icon.src = `https:${cur.condition.icon}`;
      icon.alt = cur.condition.text;
      temp.textContent = formatTemp(cur.temp_c);
      cond.textContent = cur.condition.text;

      feels.textContent = formatTemp(cur.feelslike_c);
      if (day) {
        hiLo.textContent = `${formatTemp(day.maxtemp_c)} / ${formatTemp(day.mintemp_c)}`;
      } else {
        hiLo.textContent = '—';
      }
      humidity.textContent = `${cur.humidity}%`;
      wind.textContent = formatWind(cur.wind_kph);

      // AQI (PM2.5 is a common indicator)
      const pm = cur.air_quality?.pm2_5;
      if (pm !== undefined) {
        aqi.textContent = `${pm.toFixed(1)} µg/m³`;
      } else {
        aqi.textContent = 'N/A';
      }

      // Alerts
      alerts.innerHTML = '';
      const list = d.alerts?.alert || [];
      if (list.length) {
        list.forEach(a => {
          const div = document.createElement('div');
          div.className = 'alert';
          div.innerHTML = `
            <div class="name">${a.event}</div>
            <div class="sub">${a.headline || ''}</div>
            <div class="muted" style="margin-top:6px; font-size:12px;">${a.effective || ''} → ${a.expires || ''}</div>
          `;
          alerts.appendChild(div);
        });
      } else {
        const none = document.createElement('div');
        none.className = 'muted';
        none.textContent = 'No weather alerts.';
        alerts.appendChild(none);
      }
    }

    // ====== EVENTS ======
    goBtn.addEventListener('click', () => {
      const q = input.value.trim();
      if (!q) return setStatus('Please type a city or coordinates.', 'error');
      fetchWeather(q);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        goBtn.click();
      }
    });

    unitToggle.addEventListener('change', () => {
      // Re-render last result with new unit if we have any value on the page
      if (temp.textContent !== '—' && input.value.trim()) {
        goBtn.click();
      }
    });

    locBtn.addEventListener('click', () => {
      if (!navigator.geolocation) return setStatus('Geolocation is not supported by your browser.', 'error');
      setStatus('Getting device location…');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          input.value = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
          goBtn.click();
        },
        (err) => setStatus(err.message || 'Could not get location.', 'error'),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

    // Load a pleasant default on first open
    window.addEventListener('DOMContentLoaded', () => {
      input.value = 'London';
      goBtn.click();
    });