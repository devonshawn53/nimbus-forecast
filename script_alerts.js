document.addEventListener('DOMContentLoaded', () => {
    const alertsList = document.getElementById('alerts-list');
    const sensorsList = document.getElementById('sensors-list');
    const updateBtn = document.createElement('button');
    updateBtn.id = 'update-btn';
    updateBtn.textContent = 'Atualizar Alertas';
    document.querySelector('.alerts').appendChild(updateBtn);
    
    let isConnected = false;
    let sensorData = {
        temperature: null,
        humidity: null,
        pressure: null,
        lastUpdate: null
    };

    // Configuração do Firebase
    const firebaseConfig = {
        apiKey: "xMjsSsHFhj1A7kPkcxUcRRhqbPlTS1nXaIJyUd6r",
        databaseURL: "https://nimbus-ec47d-default-rtdb.firebaseio.com"
    };

    // Inicializar Firebase
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        console.log('Firebase inicializado com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar Firebase:', error);
    }

    const database = firebase.database();

    // Função para monitorar dados do Firebase em tempo real
    function startFirebaseListener() {
        const sensorRef = database.ref('esp32_sensor');
        
        sensorRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                isConnected = true;
                sensorData = {
                    temperature: data.temperature || null,
                    humidity: data.humidity || null,
                    pressure: data.pressure || null,
                    lastUpdate: new Date().toLocaleString('pt-PT', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit'
                    })
                };
                console.log('Dados recebidos do ESP32:', sensorData);
                updateSensors();
                updateAlerts();
            } else {
                isConnected = false;
                sensorData = { temperature: null, humidity: null, pressure: null, lastUpdate: null };
                console.log('Nenhum dado encontrado no Firebase');
                updateSensors();
            }
        }, (error) => {
            console.error('Erro ao conectar com Firebase:', error);
            isConnected = false;
            sensorData = { temperature: null, humidity: null, pressure: null, lastUpdate: null };
            updateSensors();
        });
    }

    function updateAlerts() {
        // Dados da API (mantidos para comparação)
        const apiTemp = 36.5;
        const apiHumidity = 70.0;
        const apiWindGust = 125.0;
        const apiWindSpeed = 100.0;
        const apiPressure = 985.0;
        const apiUV = 6.5;

        // Usar dados do sensor se disponíveis, senão usar dados simulados
        const dhtTemp = sensorData.temperature !== null ? sensorData.temperature : 36.0;
        const dhtHumidity = sensorData.humidity !== null ? sensorData.humidity : 65.2;
        const sensorPressure = sensorData.pressure !== null ? sensorData.pressure : 986.0;

        const alerts = [];
        const now = new Date();
        const forecastDate = new Date(now);
        forecastDate.setDate(now.getDate() + 2);

        // Verificação de eventos extremos com dados do sensor
        if (Math.max(apiTemp, dhtTemp) > 35) alerts.push({
            message: `🔥 Calor Extremo (>35°C) - Sensor: ${dhtTemp}°C - Ação: Hidrate culturas`,
            icon: 'fas fa-temperature-high',
            time: now.toLocaleString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
            type: 'warning'
        });

        if (Math.max(apiHumidity, dhtHumidity) > 90) alerts.push({
            message: `💧 Umidade Crítica (>90%) - Sensor: ${dhtHumidity}% - Ação: Verifique ventilação`,
            icon: 'fas fa-tint',
            time: now.toLocaleString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
            type: 'warning'
        });

        if (apiWindGust > 20 || (apiWindGust === undefined && apiWindSpeed > 20)) alerts.push({
            message: `💨 Rajadas Fortes (>20 km/h) - Ação: Reforce estruturas`,
            icon: 'fas fa-wind',
            time: now.toLocaleString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
            type: 'warning'
        });

        if (Math.min(apiPressure, sensorPressure) < 1000 || Math.max(apiPressure, sensorPressure) > 1030) alerts.push({
            message: `📊 Pressão Anormal (<1000 ou >1030 hPa) - Sensor: ${sensorPressure} hPa - Ação: Prepare-se para tempestade`,
            icon: 'fas fa-tachometer-alt',
            time: now.toLocaleString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
            type: 'danger'
        });

        if (apiUV > 8) alerts.push({
            message: `☀️ Índice UV Extremo (>8) - Ação: Proteja trabalhadores`,
            icon: 'fas fa-sun',
            time: now.toLocaleString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
            type: 'warning'
        });

        if (apiWindGust > 63 || (apiWindGust === undefined && apiWindSpeed > 63)) {
            alerts.push({
                message: `⛈️ Tempestade Tropical (ventos >63 km/h) prevista para ${forecastDate.toLocaleDateString('pt-PT')} - Ação: Proteja plantações`,
                icon: 'fas fa-cloud-showers-heavy',
                time: now.toLocaleString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
                type: 'danger'
            });
        }

        if (apiWindGust > 119 || (apiWindGust === undefined && apiWindSpeed > 119)) {
            alerts.push({
                message: `🌀 Ciclone Tropical (ventos >119 km/h) previsto para ${forecastDate.toLocaleDateString('pt-PT')} - Ação: Evacue áreas de risco`,
                icon: 'fas fa-hurricane',
                time: now.toLocaleString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
                type: 'danger'
            });
        }

        if (apiPressure < 990) {
            alerts.push({
                message: `🌪️ Possível Ciclone (pressão <990 hPa) previsto para ${forecastDate.toLocaleDateString('pt-PT')} - Ação: Reforce segurança`,
                icon: 'fas fa-hurricane',
                time: now.toLocaleString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
                type: 'danger'
            });
        }

        // Alertas específicos para dados do sensor
        if (sensorData.temperature !== null && sensorData.temperature > 40) {
            alerts.push({
                message: `🚨 TEMPERATURA CRÍTICA NO SENSOR: ${sensorData.temperature}°C - Ação Imediata Necessária!`,
                icon: 'fas fa-exclamation-triangle',
                time: now.toLocaleString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
                type: 'danger'
            });
        }

        if (sensorData.temperature !== null && sensorData.temperature < 5) {
            alerts.push({
                message: `❄️ Temperatura Baixa no Sensor: ${sensorData.temperature}°C - Risco de Geada!`,
                icon: 'fas fa-temperature-low',
                time: now.toLocaleString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
                type: 'warning'
            });
        }

        alertsList.innerHTML = '';
        if (alerts.length === 0) {
            const div = document.createElement('div');
            div.className = 'alert-item';
            div.innerHTML = '<i class="fas fa-check-circle" style="color: green;"></i> Nenhuma condição extrema detectada';
            alertsList.appendChild(div);
        } else {
            alerts.forEach(alert => {
                const div = document.createElement('div');
                div.className = `alert-item ${alert.type === 'danger' ? 'danger-alert' : 'warning-alert'}`;
                div.innerHTML = `
                    <div style="display: flex; align-items: center;">
                        <i class="${alert.icon}" style="color: ${alert.type === 'danger' ? '#ff0000' : '#ffcc00'}; margin-right: 10px;"></i>
                        <div>
                            <strong>Alerta às ${alert.time} de ${now.toLocaleDateString('pt-PT')}:</strong><br>
                            ${alert.message}
                        </div>
                    </div>
                `;
                alertsList.appendChild(div);
            });
        }
    }

    function updateSensors() {
        sensorsList.innerHTML = '';
        
        if (!isConnected) {
            const div = document.createElement('div');
            div.className = 'sensor-item no-connection';
            div.innerHTML = `
                <i class="fas fa-unlink" style="color: #ff0000;"></i> 
                <strong>ESP32 Desconectado</strong><br>
                <small>Aguardando dados do sensor...</small>
            `;
            sensorsList.appendChild(div);
            return;
        }

        const sensors = [
            { 
                label: 'Temperatura', 
                value: `${sensorData.temperature !== null ? sensorData.temperature.toFixed(1) : 'N/A'}°C`, 
                icon: 'fas fa-thermometer-half',
                color: sensorData.temperature > 35 ? '#ff4444' : '#27ae60'
            },
            { 
                label: 'Umidade', 
                value: `${sensorData.humidity !== null ? sensorData.humidity.toFixed(1) : 'N/A'}%`, 
                icon: 'fas fa-tint',
                color: sensorData.humidity > 90 ? '#ff4444' : '#3498db'
            },
            { 
                label: 'Pressão', 
                value: `${sensorData.pressure !== null ? sensorData.pressure.toFixed(1) : 'N/A'} hPa`, 
                icon: 'fas fa-tachometer-alt',
                color: '#9b59b6'
            },
            { 
                label: 'Última Atualização', 
                value: sensorData.lastUpdate || 'N/A', 
                icon: 'fas fa-clock',
                color: '#f39c12'
            }
        ];

        sensors.forEach(sensor => {
            const div = document.createElement('div');
            div.className = 'sensor-item';
            div.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <div style="display: flex; align-items: center;">
                        <i class="${sensor.icon}" style="color: ${sensor.color}; margin-right: 10px;"></i>
                        <span>${sensor.label}:</span>
                    </div>
                    <strong style="color: ${sensor.color};">${sensor.value}</strong>
                </div>
            `;
            sensorsList.appendChild(div);
        });

        // Adicionar indicador de conexão
        const statusDiv = document.createElement('div');
        statusDiv.className = 'sensor-item';
        statusDiv.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; background: #e8f5e9; padding: 10px; border-radius: 5px;">
                <i class="fas fa-wifi" style="color: green; margin-right: 10px;"></i>
                <strong style="color: green;">Conectado ao ESP32 - Dados em Tempo Real</strong>
            </div>
        `;
        sensorsList.appendChild(statusDiv);
    }

    updateBtn.addEventListener('click', updateAlerts);

    // Iniciar monitoramento do Firebase
    startFirebaseListener();

    // Atualizações iniciais
    updateSensors();
    updateAlerts();
});