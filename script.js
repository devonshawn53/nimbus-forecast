// === CONFIGURAÇÃO DO FIREBASE ===
const firebaseConfig = {
    apiKey: "xMjsSsHFhj1A7kPkcxUcRRhqbPlTS1nXaIJyUd6r",
    databaseURL: "https://nimbus-ec47d-default-rtdb.firebaseio.com"
};

// Inicializar Firebase
let database;
try {
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        database = firebase.database();
        console.log('✅ Firebase inicializado com sucesso');
    }
} catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error);
}

// === SISTEMA DE SMS ===
let numerosSMS = [];

// === VARIÁVEIS GLOBAIS ===
let currentWeatherData = null;
let currentForecastData = null;
let esp32Data = {
    temperature: null,
    humidity: null,
    pressure: null,
    connected: false,
    lastUpdate: null
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando Nimbus Forecast...');
    
    // Inicializar componentes
    inicializarGrafico();
    inicializarTema();
    inicializarTraducao();
    inicializarSMS();
    inicializarMapa();
    inicializarDicasCulturas();
    
    // Iniciar monitoramentos
    startESP32Monitoring();
    monitorarEstacaoClimatica();
    
    // Buscar dados iniciais
    buscarDadosClimaticos('Maputo');
    
    // Event listeners
    document.getElementById('search-btn').addEventListener('click', () => {
        const cidade = document.getElementById('city-input').value || 'Maputo';
        buscarDadosClimaticos(cidade);
    });
    
    document.getElementById('open-alerts').addEventListener('click', abrirAlertas);
});

// === INICIALIZAÇÃO DO GRÁFICO ===
function inicializarGrafico() {
    const ctx = document.getElementById('forecastChart').getContext('2d');
    return new Chart(ctx, {
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
            scales: { 
                y: { 
                    beginAtZero: true, 
                    max: 100,
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#fff' }
                },
                x: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#fff' }
                }
            },
            plugins: { 
                legend: { display: false }, 
                tooltip: { 
                    enabled: true,
                    backgroundColor: 'rgba(0,0,0,0.8)'
                } 
            },
            animation: { duration: 2000 },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// === SISTEMA DE TEMA ===
function inicializarTema() {
    const toggleBtn = document.getElementById('theme-toggle');
    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        document.body.classList.toggle('dark-mode');
        toggleBtn.innerHTML = document.body.classList.contains('dark-mode') 
            ? '<i class="fas fa-moon"></i>' 
            : '<i class="fas fa-sun"></i>';
    });
}

// === SISTEMA DE TRADUÇÃO ===
function inicializarTraducao() {
    const translations = {
        pt: {
            weekly: 'Previsão Semanal',
            sensors: '🏭 Estação Climática em Tempo Real',
            map: 'Mapa de Condições',
            sms: '📱 Sistema de Alertas SMS',
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
            sensors: 'Estação ya Clima em Tempo Real',
            map: 'Mapa wa Condições',
            sms: 'Sistema ya Alertas SMS',
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
            sensors: 'Estação Climática (Sena)',
            map: 'Mapa de Condições (Sena)',
            sms: 'Sistema de Alertas SMS (Sena)',
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

    document.getElementById('lang-select').addEventListener('change', (e) => {
        const lang = e.target.value;
        const trad = translations[lang];
        
        document.getElementById('weekly-title').textContent = trad.weekly;
        document.getElementById('sensors-title').textContent = trad.sensors;
        document.getElementById('map-title').textContent = trad.map;
        document.getElementById('sms-title').textContent = trad.sms;
        document.getElementById('crop-title').textContent = trad.crop;
        document.getElementById('alerts-title').textContent = trad.alerts;
        document.getElementById('humidity-label').textContent = trad.humidity;
        document.getElementById('wind-label').textContent = trad.wind;
        document.getElementById('rainChance-label').textContent = trad.rainChance;
        document.getElementById('uv-label').textContent = trad.uv;
        document.getElementById('pressure-label').textContent = trad.pressure;
        document.getElementById('aqi-label').textContent = trad.aqi;
    });
}

// === SISTEMA DE SMS ===
function inicializarSMS() {
    carregarNumerosSalvos();
    document.getElementById('adicionar-numero').addEventListener('click', adicionarNumero);
    document.getElementById('novo-numero').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') adicionarNumero();
    });
    
    atualizarProximoSMS();
    setInterval(atualizarProximoSMS, 60000);
}

function carregarNumerosSalvos() {
    const salvos = localStorage.getItem('numerosSMS');
    if (salvos) {
        numerosSMS = JSON.parse(salvos);
        atualizarListaNumeros();
    }
}

function salvarNumeros() {
    localStorage.setItem('numerosSMS', JSON.stringify(numerosSMS));
}

function adicionarNumero() {
    const numero = document.getElementById('novo-numero').value.trim();
    
    const regex = /^\+\d{12,15}$/;
    if (!regex.test(numero)) {
        alert('Formato inválido! Use: +258XXXXXXXXX');
        return;
    }
    
    if (numerosSMS.includes(numero)) {
        alert('Este número já está cadastrado!');
        return;
    }
    
    numerosSMS.push(numero);
    salvarNumeros();
    atualizarListaNumeros();
    document.getElementById('novo-numero').value = '';
    
    console.log(`✅ Número adicionado: ${numero}`);
}

function removerNumero(numero) {
    numerosSMS = numerosSMS.filter(n => n !== numero);
    salvarNumeros();
    atualizarListaNumeros();
}

function atualizarListaNumeros() {
    const listaNumerosDiv = document.getElementById('lista-numeros');
    const totalNumerosSpan = document.getElementById('total-numeros');
    
    listaNumerosDiv.innerHTML = '';
    
    if (numerosSMS.length === 0) {
        listaNumerosDiv.innerHTML = `
            <div class="text-gray-500 text-center py-4">
                <i class="fas fa-phone-slash text-2xl mb-2"></i>
                <div>Nenhum número cadastrado</div>
            </div>
        `;
    } else {
        numerosSMS.forEach(numero => {
            const div = document.createElement('div');
            div.className = 'flex justify-between items-center p-2 bg-gray-700 rounded';
            div.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-mobile-alt text-green-400 mr-2"></i>
                    <span>${numero}</span>
                </div>
                <button class="text-red-400 hover:text-red-300 remover-numero" data-numero="${numero}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            listaNumerosDiv.appendChild(div);
        });
        
        document.querySelectorAll('.remover-numero').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const numero = e.target.closest('button').dataset.numero;
                removerNumero(numero);
            });
        });
    }
    
    totalNumerosSpan.textContent = numerosSMS.length;
}

function atualizarProximoSMS() {
    const agora = new Date();
    const proximo = new Date(agora);
    proximo.setHours(agora.getHours() + 1);
    proximo.setMinutes(0);
    proximo.setSeconds(0);
    
    const diff = proximo - agora;
    const minutos = Math.floor(diff / 60000);
    
    document.getElementById('proximo-sms').textContent = minutos <= 0 ? 'Em breve...' : `${minutos} min`;
}

// === MONITORAMENTO DA ESTAÇÃO CLIMÁTICA ===
function monitorarEstacaoClimatica() {
    if (!database) return;
    
    const estacaoRef = database.ref('estacao_climatica');
    
    estacaoRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            document.getElementById('temp-estacao').textContent = `${data.temperatura?.toFixed(1) || '--'}°C`;
            document.getElementById('umidade-estacao').textContent = `${data.umidade_ar?.toFixed(1) || '--'}%`;
            document.getElementById('solo-estacao').textContent = `${data.umidade_solo?.toFixed(1) || '--'}%`;
            
            const statusSms = document.getElementById('status-sms');
            if (data.alertas_sms) {
                statusSms.classList.remove('hidden');
            }
            
            console.log('📡 Dados da estação:', data);
        }
    });
}

// === MAPA ===
function inicializarMapa() {
    const map = L.map('weather-map').setView([-25.891968, 32.605135], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    
    // Marcador para estação climática
    L.marker([-25.891968, 32.605135])
        .addTo(map)
        .bindPopup('🏭 Estação Climática Nimbus<br>Dados em tempo real')
        .openPopup();
}

// === DICAS PARA CULTURAS ===
function inicializarDicasCulturas() {
    const cropTipsData = {
        milho: {
            highTemp: '🌡️ Temperatura >35°C: Irrigue mais e proteja as plantas com sombra.',
            highRain: '🌧️ Chuva >80%: Evite irrigação e verifique drenagem.',
            highHumidity: '💧 Umidade >90%: Monitore fungos nas folhas.',
            highWind: '💨 Vento >20 km/h: Reforce suportes das plantas.',
            normal: '✅ Condições ideais para o milho. Continue o manejo regular.'
        },
        mandioca: {
            highTemp: '🌡️ Temperatura >35°C: Aumente a irrigação para evitar ressecamento.',
            highRain: '🌧️ Chuva >80%: Certifique-se de que o solo drena bem.',
            highHumidity: '💧 Umidade >90%: Cuidado com doenças nas raízes.',
            highWind: '💨 Vento >20 km/h: Verifique a estabilidade das plantas.',
            normal: '✅ Condições boas para mandioca. Mantenha o solo bem drenado.'
        },
        arroz: {
            highTemp: '🌡️ Temperatura >35°C: Mantenha os campos inundados.',
            highRain: '🌧️ Chuva >80%: Controle o nível de água nos campos.',
            highHumidity: '💧 Umidade >90%: Monitore pragas como fungos.',
            highWind: '💨 Vento >20 km/h: Proteja os campos de danos.',
            normal: '✅ Condições excelentes para arroz. Mantenha irrigação adequada.'
        }
    };

    document.getElementById('crop-select').addEventListener('change', (e) => {
        const crop = e.target.value;
        const cropTips = document.getElementById('crop-tips');
        
        if (!crop || !currentWeatherData || !currentForecastData) {
            cropTips.textContent = 'Selecione uma cultura e busque dados climáticos';
            return;
        }
        
        const temp = currentWeatherData.main.temp;
        const humidity = currentWeatherData.main.humidity;
        const wind = currentWeatherData.wind.speed;
        const rain = currentForecastData.list[0].pop * 100;

        let tip = cropTipsData[crop].normal;
        if (temp > 35) tip = cropTipsData[crop].highTemp;
        else if (rain > 80) tip = cropTipsData[crop].highRain;
        else if (humidity > 90) tip = cropTipsData[crop].highHumidity;
        else if (wind > 20) tip = cropTipsData[crop].highWind;
        
        cropTips.textContent = tip;
    });
}

// === MONITORAMENTO DO ESP32 ===
function startESP32Monitoring() {
    if (!database) {
        console.log('Firebase Database não disponível');
        return;
    }

    try {
        const sensorRef = database.ref('esp32_sensor');
        
        sensorRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                esp32Data = {
                    temperature: data.temperature || null,
                    humidity: data.humidity || null,
                    pressure: data.pressure || null,
                    connected: true,
                    lastUpdate: new Date().toLocaleString('pt-PT')
                };
                console.log('📡 Dados do ESP32:', esp32Data);
                atualizarPainelSensores();
            } else {
                esp32Data.connected = false;
                atualizarPainelSensores();
            }
        });
    } catch (error) {
        console.error('❌ Erro no monitoramento:', error);
    }
}

function atualizarPainelSensores() {
    const sensorsGrid = document.getElementById('sensors-grid');
    if (!sensorsGrid) return;

    sensorsGrid.innerHTML = '';

    if (!esp32Data.connected) {
        sensorsGrid.innerHTML = `
            <div class="text-center p-4 bg-red-900 bg-opacity-20 rounded-lg border border-red-400">
                <i class="fas fa-unlink text-2xl text-red-400 mb-2"></i>
                <h3 class="text-red-400 font-semibold">ESP32 Desconectado</h3>
                <p class="text-gray-400 text-sm">Aguardando dados do sensor...</p>
            </div>
        `;
        return;
    }

    const sensores = [
        {
            icon: 'fa-thermometer-half',
            label: 'Temperatura ESP32',
            valor: `${esp32Data.temperature?.toFixed(1) || '--'}°C`,
            cor: esp32Data.temperature > 35 ? 'text-red-400' : 'text-blue-400',
            alerta: esp32Data.temperature > 35 ? '⚠️ Alerta de Calor' : ''
        },
        {
            icon: 'fa-tint',
            label: 'Umidade ESP32',
            valor: `${esp32Data.humidity?.toFixed(1) || '--'}%`,
            cor: esp32Data.humidity > 90 ? 'text-red-400' : 'text-green-400',
            alerta: esp32Data.humidity > 90 ? '⚠️ Umidade Alta' : ''
        },
        {
            icon: 'fa-tachometer-alt',
            label: 'Pressão ESP32',
            valor: `${esp32Data.pressure?.toFixed(1) || '--'} hPa`,
            cor: 'text-purple-400',
            alerta: ''
        }
    ];

    sensores.forEach(sensor => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-3 bg-gray-800 bg-opacity-50 rounded-lg';
        div.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${sensor.icon} text-xl ${sensor.cor} mr-3"></i>
                <div>
                    <div class="font-semibold">${sensor.label}</div>
                    <div class="text-xs text-gray-400">Tempo Real</div>
                </div>
            </div>
            <div class="text-right">
                <div class="text-lg font-bold ${sensor.cor}">${sensor.valor}</div>
                ${sensor.alerta ? `<div class="text-xs text-red-400">${sensor.alerta}</div>` : ''}
            </div>
        `;
        sensorsGrid.appendChild(div);
    });

    const statusDiv = document.createElement('div');
    statusDiv.className = 'text-center p-2 bg-green-900 bg-opacity-20 rounded border border-green-400 mt-2';
    statusDiv.innerHTML = `
        <i class="fas fa-wifi text-green-400 mr-2"></i>
        <span class="text-green-400 font-semibold">ESP32 Conectado</span>
        <div class="text-xs text-gray-400">Atualizado: ${esp32Data.lastUpdate}</div>
    `;
    sensorsGrid.appendChild(statusDiv);
}

// === BUSCA DE DADOS CLIMÁTICOS ===
async function buscarDadosClimaticos(cidade) {
    const apiKey = 'ca50095dd2e55f8a7fff4b1c5db19763';
    const errorMessage = document.getElementById('error-message');
    const loadingSpinner = document.getElementById('loading-spinner');

    errorMessage.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');

    try {
        // Buscar dados atuais
        const responseClima = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cidade}&units=metric&appid=${apiKey}&lang=pt`);
        if (!responseClima.ok) throw new Error('Cidade não encontrada');
        
        currentWeatherData = await responseClima.json();
        atualizarDadosClimaticos(currentWeatherData);

        // Buscar previsão
        const responsePrevisao = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${cidade}&units=metric&appid=${apiKey}&lang=pt`);
        if (!responsePrevisao.ok) throw new Error('Erro na previsão');
        
        currentForecastData = await responsePrevisao.json();
        atualizarPrevisao(currentForecastData);

        // Atualizar dicas de culturas
        document.getElementById('crop-select').dispatchEvent(new Event('change'));

    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.classList.remove('hidden');
    } finally {
        loadingSpinner.classList.add('hidden');
    }
}

function atualizarDadosClimaticos(data) {
    document.getElementById('temp').textContent = `${Math.round(data.main.temp)}°C`;
    document.getElementById('location').textContent = `Localização Atual: ${data.name}, ${data.sys.country}`;
    
    const icon = document.querySelector('.icon i');
    const weather = data.weather[0].main.toLowerCase();
    if (weather.includes('cloud')) icon.className = 'fas fa-cloud';
    else if (weather.includes('rain')) icon.className = 'fas fa-cloud-rain';
    else if (weather.includes('clear')) icon.className = 'fas fa-sun';
    else icon.className = 'fas fa-cloud-sun';

    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('wind').textContent = `${data.wind.speed} km/h`;
    document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;

    // Atualizar confiabilidade com dados do ESP32
    const reliability = esp32Data.temperature && Math.abs(data.main.temp - esp32Data.temperature) < 5 ? 'Alta' : 'Média';
    document.getElementById('data-reliability').textContent = `Confiabilidade: ${reliability}`;
}

function atualizarPrevisao(forecastData) {
    const daysGrid = document.getElementById('days-grid');
    daysGrid.innerHTML = '';

    const daily = {};
    forecastData.list.forEach(item => {
        const date = new Date(item.dt_txt);
        const dayName = date.toLocaleDateString('pt-PT', { weekday: 'short' }).toUpperCase();
        if (!daily[dayName]) {
            daily[dayName] = {
                min: item.main.temp_min,
                max: item.main.temp_max,
                icon: item.weather[0].main,
                rain: item.pop * 100
            };
        }
    });

    const firstDate = new Date(forecastData.list[0].dt_txt);
    for (let i = 0; i < 7; i++) {
        const day = new Date(firstDate);
        day.setDate(firstDate.getDate() + i);
        const dayName = day.toLocaleDateString('pt-PT', { weekday: 'short' }).toUpperCase();
        const dayDate = day.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });

        const div = document.createElement('div');
        div.className = 'day';
        
        if (daily[dayName]) {
            let iconClass = 'fas fa-sun';
            if (daily[dayName].icon.toLowerCase().includes('cloud')) iconClass = 'fas fa-cloud';
            else if (daily[dayName].icon.toLowerCase().includes('rain')) iconClass = 'fas fa-cloud-rain';
            
            div.innerHTML = `
                <div class="font-semibold">${dayName}</div>
                <div class="text-xs text-gray-400">${dayDate}</div>
                <div class="my-2"><i class="${iconClass} text-yellow-400"></i></div>
                <div class="text-sm">${Math.round(daily[dayName].min)}/${Math.round(daily[dayName].max)}°</div>
            `;
        } else {
            div.innerHTML = `
                <div class="font-semibold">${dayName}</div>
                <div class="text-xs text-gray-400">${dayDate}</div>
                <div class="my-2"><i class="fas fa-question text-gray-400"></i></div>
                <div class="text-sm">--/--°</div>
            `;
        }
        daysGrid.appendChild(div);
    }

    document.getElementById('rainChance').textContent = `${Math.round(forecastData.list[0].pop * 100)}%`;

    // Atualizar gráfico
    const chart = Chart.getChart('forecastChart');
    if (chart) {
        chart.data.labels = forecastData.list.slice(0, 8).map(item => 
            new Date(item.dt_txt).toLocaleTimeString('pt-PT', { hour: '2-digit' })
        );
        chart.data.datasets[0].data = forecastData.list.slice(0, 8).map(item => item.pop * 100);
        chart.update();
    }

    // Notificação de chuva
    if (forecastData.list[0].pop * 100 > 80) {
        if (Notification.permission === 'granted') {
            new Notification('🌧️ Alerta de Chuva', {
                body: 'Alta probabilidade de chuva detectada!',
                icon: '/icon.png'
            });
        }
    }
}

// === ALERTAS ===
function abrirAlertas() {
    const alertsWindow = window.open('alerts.html', 'AlertasClimaticos', 'width=600,height=700');
    if (!alertsWindow) {
        document.getElementById('error-message').textContent = 'Por favor, permita pop-ups para ver os alertas.';
        document.getElementById('error-message').classList.remove('hidden');
    }
}

// === INICIALIZAÇÃO DE SERVIÇOS ===
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(() => console.log('✅ Service Worker registrado'))
        .catch(err => console.error('❌ Erro Service Worker:', err));
}

// Buscar dados iniciais
setTimeout(() => buscarDadosClimaticos('Maputo'), 1000);