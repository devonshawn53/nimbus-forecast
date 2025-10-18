document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('forecastChart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Precipitação (%)',
                data: [],
                borderColor: '#63b3ed',
                backgroundColor: 'rgba(99, 179, 237, 0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            scales: { y: { beginAtZero: true, max: 100 } },
            plugins: { legend: { display: false }, tooltip: { enabled: true } },
            animation: { duration: 2000 }
        }
    });

    const toggleBtn = document.getElementById('theme-toggle');
    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        document.body.classList.toggle('dark-mode');
        toggleBtn.innerHTML = document.body.classList.contains('dark-mode') 
            ? '<i class="fas fa-moon"></i>' 
            : '<i class="fas fa-sun"></i>';
    });

    const apiKey = 'ca50095dd2e55f8a7fff4b1c5db19763'; // Substitua pela sua chave
    const searchBtn = document.getElementById('search-btn');
    const openAlertsBtn = document.getElementById('open-alerts');
    const daysGrid = document.getElementById('days-grid');
    const errorMessage = document.getElementById('error-message');
    const loadingSpinner = document.getElementById('loading-spinner');
    const langSelect = document.getElementById('lang-select');
    const cropSelect = document.getElementById('crop-select');
    const cropTips = document.getElementById('crop-tips');
    const smsNumberInput = document.getElementById('sms-number');
    const smsSaveBtn = document.getElementById('sms-save');
    const sensorsGrid = document.getElementById('sensors-grid');

    const translations = {
        pt: {
            weekly: 'Previsão Semanal',
            sensors: 'Rede de Sensores',
            map: 'Mapa de Condições',
            sms: 'Configurar Alertas SMS',
            crop: 'Dicas para Culturas',
            alerts: 'Alertas de Clima Extremo',
            humidity: 'Umidade',
            wind: 'Vento',
            rainChance: 'Poss. de Chuva',
            uv: 'Índice UV',
            pressure: 'Pressão',
            aqi: 'Qualidade Ar'
        },
        ch: {
            weekly: 'Previsão ya Semana',
            sensors: 'Rede ya Sensores',
            map: 'Mapa wa Condições',
            sms: 'Configurar Alertas SMS',
            crop: 'Dicas para Culturas',
            alerts: 'Alertas ya Clima Extremo',
            humidity: 'Umidadi',
            wind: 'Vento',
            rainChance: 'Possibilidade ya Chuva',
            uv: 'Índice UV',
            pressure: 'Pressão',
            aqi: 'Qualidade ya Ar'
        },
        se: {
            weekly: 'Previsão Semanal (Sena)',
            sensors: 'Rede de Sensores (Sena)',
            map: 'Mapa de Condições (Sena)',
            sms: 'Configurar Alertas SMS (Sena)',
            crop: 'Dicas para Culturas (Sena)',
            alerts: 'Alertas de Clima Extremo (Sena)',
            humidity: 'Umidadi (Sena)',
            wind: 'Vento (Sena)',
            rainChance: 'Poss. de Chuva (Sena)',
            uv: 'Índice UV (Sena)',
            pressure: 'Pressão (Sena)',
            aqi: 'Qualidade Ar (Sena)'
        }
    };

    langSelect.addEventListener('change', () => {
        const lang = langSelect.value;
        document.getElementById('weekly-title').textContent = translations[lang].weekly;
        document.getElementById('sensors-title').textContent = translations[lang].sensors;
        document.getElementById('map-title').textContent = translations[lang].map;
        document.getElementById('sms-title').textContent = translations[lang].sms;
        document.getElementById('crop-title').textContent = translations[lang].crop;
        document.getElementById('alerts-title').textContent = translations[lang].alerts;
        document.getElementById('humidity-label').textContent = translations[lang].humidity;
        document.getElementById('wind-label').textContent = translations[lang].wind;
        document.getElementById('rainChance-label').textContent = translations[lang].rainChance;
        document.getElementById('uv-label').textContent = translations[lang].uv;
        document.getElementById('pressure-label').textContent = translations[lang].pressure;
        document.getElementById('aqi-label').textContent = translations[lang].aqi;
    });

    const cropTipsData = {
        milho: {
            highTemp: 'Temperatura >35°C: Irrigue mais e proteja as plantas com sombra.',
            highRain: 'Chuva >80%: Evite irrigação e verifique drenagem.',
            highHumidity: 'Umidade >90%: Monitore fungos nas folhas.',
            highWind: 'Vento >20 km/h: Reforce suportes das plantas.'
        },
        mandioca: {
            highTemp: 'Temperatura >35°C: Aumente a irrigação para evitar ressecamento.',
            highRain: 'Chuva >80%: Certifique-se de que o solo drena bem.',
            highHumidity: 'Umidade >90%: Cuidado com doenças nas raízes.',
            highWind: 'Vento >20 km/h: Verifique a estabilidade das plantas.'
        },
        arroz: {
            highTemp: 'Temperatura >35°C: Mantenha os campos inundados.',
            highRain: 'Chuva >80%: Controle o nível de água nos campos.',
            highHumidity: 'Umidade >90%: Monitore pragas como fungos.',
            highWind: 'Vento >20 km/h: Proteja os campos de danos.'
        }
    };

    let currentWeatherData = null;
    let currentForecastData = null;

    cropSelect.addEventListener('change', () => {
        const crop = cropSelect.value;
        if (!crop || !currentWeatherData || !currentForecastData) {
            cropTips.textContent = '';
            return;
        }
        const temp = currentWeatherData.main.temp;
        const humidity = currentWeatherData.main.humidity;
        const wind = currentWeatherData.wind.speed;
        const rain = currentForecastData.list[0].pop * 100;

        let tip = '';
        if (crop in cropTipsData) {
            if (temp > 35) tip = cropTipsData[crop].highTemp;
            else if (rain > 80) tip = cropTipsData[crop].highRain;
            else if (humidity > 90) tip = cropTipsData[crop].highHumidity;
            else if (wind > 20) tip = cropTipsData[crop].highWind;
            else tip = 'Condições normais. Continue o manejo regular.';
        }
        cropTips.textContent = tip;
    });

    smsSaveBtn.addEventListener('click', () => {
        const number = smsNumberInput.value;
        if (!number.match(/^\+\d{8,}$/)) {
            errorMessage.textContent = 'Número de telefone inválido. Use formato internacional (ex.: +25812345678).';
            errorMessage.classList.remove('hidden');
            return;
        }
        errorMessage.classList.add('hidden');
        console.log(`Número salvo para SMS: ${number}`);
        // Simulação: enviar número para backend GSM
    });

    const map = L.map('weather-map').setView([-25.891968, 32.605135], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const sensorData = [
        { id: 1, lat: -25.891968, lon: 32.605135, temp: 36.0, humidity: 65.2, pressure: 986.0 },
        { id: 2, lat: -25.9, lon: 32.6, temp: 35.5, humidity: 70.0, pressure: 985.0 }
    ];

    function updateSensors() {
        sensorsGrid.innerHTML = '';
        sensorData.forEach(sensor => {
            const div = document.createElement('div');
            div.className = 'sensor';
            div.innerHTML = `Sensor ${sensor.id}: ${sensor.temp}°C, ${sensor.humidity}%, ${sensor.pressure} hPa`;
            sensorsGrid.appendChild(div);
            L.marker([sensor.lat, sensor.lon])
                .addTo(map)
                .bindPopup(`Sensor ${sensor.id}: ${sensor.temp}°C, ${sensor.humidity}%, ${sensor.pressure} hPa`);
        });
    }

    updateSensors();

    searchBtn.addEventListener('click', () => {
        const city = document.getElementById('city-input').value || 'Maputo';
        errorMessage.classList.add('hidden');
        loadingSpinner.classList.remove('hidden');

        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}&lang=pt`)
            .then(response => {
                if (!response.ok) throw new Error('Cidade não encontrada');
                return response.json();
            })
            .then(data => {
                currentWeatherData = data;
                document.getElementById('temp').textContent = `${Math.round(data.main.temp)}°C`;
                document.getElementById('location').textContent = `Localização Atual: ${data.name}, ${data.sys.country}`;
                const icon = document.querySelector('.icon i');
                const weather = data.weather[0].main.toLowerCase();
                if (weather.includes('cloud')) icon.className = 'fas fa-cloud-moon';
                else if (weather.includes('rain')) icon.className = 'fas fa-cloud-rain';
                else icon.className = 'fas fa-sun';

                document.getElementById('humidity').textContent = `${data.main.humidity}%`;
                document.getElementById('wind').textContent = `${data.wind.speed} km/h`;
                document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;

                const sensorTemp = sensorData[0].temp;
                const reliability = Math.abs(data.main.temp - sensorTemp) < 5 ? 'Alta' : 'Baixa';
                document.getElementById('data-reliability').textContent = `Confiabilidade: ${reliability}`;

                const lat = data.coord.lat;
                const lon = data.coord.lon;
                map.setView([lat, lon], 8);

                fetch(`https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${apiKey}`)
                    .then(uvResponse => uvResponse.json())
                    .then(uvData => {
                        const uvValue = uvData.value;
                        let uvText = uvValue < 3 ? `${uvValue} Baixo` : uvValue < 6 ? `${uvValue} Moderado` : uvValue < 8 ? `${uvValue} Alto` : `${uvValue} Muito Alto`;
                        document.getElementById('uv').textContent = uvText;
                    });

                fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`)
                    .then(airResponse => airResponse.json())
                    .then(airData => {
                        const aqi = airData.list[0].main.aqi;
                        const aqiText = { 1: 'Good', 2: 'Fair', 3: 'Moderate', 4: 'Poor', 5: 'Very Poor' }[aqi];
                        document.getElementById('aqi').textContent = aqiText;
                    });

                fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}&lang=pt`)
                    .then(response => {
                        if (!response.ok) throw new Error('Erro na previsão');
                        return response.json();
                    })
                    .then(forecastData => {
                        currentForecastData = forecastData;
                        daysGrid.innerHTML = '';
                        const daily = {};
                        forecastData.list.forEach(item => {
                            const date = new Date(item.dt_txt);
                            const dayName = date.toLocaleDateString('pt-PT', { weekday: 'short' }).toUpperCase();
                            const dayDate = date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
                            if (!daily[dayName]) {
                                daily[dayName] = {
                                    min: item.main.temp_min,
                                    max: item.main.temp_max,
                                    icon: item.weather[0].main,
                                    date: dayDate,
                                    rain: item.pop * 100
                                };
                            }
                        });

                        const firstDate = new Date(forecastData.list[0].dt_txt);
                        const daysOrder = [];
                        for (let i = 0; i < 7; i++) {
                            const day = new Date(firstDate);
                            day.setDate(firstDate.getDate() + i);
                            const dayName = day.toLocaleDateString('pt-PT', { weekday: 'short' }).toUpperCase();
                            const dayDate = day.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
                            daysOrder.push({ name: dayName, date: dayDate });
                        }

                        daysOrder.forEach(dayObj => {
                            const day = dayObj.name;
                            const div = document.createElement('div');
                            div.className = 'day';
                            if (daily[day]) {
                                let iconClass = 'fas fa-sun';
                                if (daily[day].icon.toLowerCase().includes('cloud')) iconClass = 'fas fa-cloud';
                                else if (daily[day].icon.toLowerCase().includes('rain')) iconClass = 'fas fa-cloud-rain';
                                div.innerHTML = `${day} (${dayObj.date}) <span class="day-icon"><i class="${iconClass}"></i></span> ${Math.round(daily[day].min)}/${Math.round(daily[day].max)}°`;
                            } else {
                                div.innerHTML = `${day} (${dayObj.date}) <span class="day-icon"><i class="fas fa-question"></i></span> N/A`;
                            }
                            daysGrid.appendChild(div);
                        });

                        document.getElementById('rainChance').textContent = `${Math.round(forecastData.list[0].pop * 100)}%`;

                        chart.data.labels = forecastData.list.slice(0, 8).map(item => new Date(item.dt_txt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }));
                        chart.data.datasets[0].data = forecastData.list.slice(0, 8).map(item => item.pop * 100);
                        chart.update();

                        cropSelect.dispatchEvent(new Event('change'));

                        if (forecastData.list[0].pop * 100 > 80) {
                            new Notification('Alerta de Clima', {
                                body: 'Alta probabilidade de chuva detectada!',
                                icon: 'icon.png'
                            });
                        }
                    })
                    .catch(error => {
                        errorMessage.textContent = error.message;
                        errorMessage.classList.remove('hidden');
                    })
                    .finally(() => {
                        loadingSpinner.classList.add('hidden');
                    });
            })
            .catch(error => {
                errorMessage.textContent = error.message;
                errorMessage.classList.remove('hidden');
                loadingSpinner.classList.add('hidden');
            });
    });

    openAlertsBtn.addEventListener('click', () => {
        const alertsWindow = window.open('alerts.html', 'AlertasClimaticos', 'width=400,height=500');
        if (alertsWindow) {
            alertsWindow.onload = () => {
                const script = alertsWindow.document.createElement('script');
                script.src = 'script_alerts.js';
                alertsWindow.document.body.appendChild(script);
            };
        } else {
            errorMessage.textContent = 'Por favor, permita pop-ups para ver os alertas.';
            errorMessage.classList.remove('hidden');
        }
    });
});