document.addEventListener('DOMContentLoaded', () => {
    const alertsList = document.getElementById('alerts-list');
    const sensorsList = document.getElementById('sensors-list');
    const updateBtn = document.createElement('button');
    updateBtn.id = 'update-btn';
    updateBtn.textContent = 'Atualizar Alertas';
    document.querySelector('.alerts').appendChild(updateBtn);
    let isConnected = true;

    function updateAlerts() {
        // Dados simulados para a avaliação (ajuste antes da apresentação se necessário)
        const apiTemp = 36.5; // Calor Extremo
        const apiHumidity = 70.0;
        const apiWindGust = 125.0; // Ciclone Tropical
        const apiWindSpeed = 100.0;
        const apiPressure = 985.0; // Possível Ciclone
        const apiUV = 6.5;
        const dhtTemp = 36.0; // Alinha com Calor Extremo
        const dhtHumidity = 65.2;
        const sensorPressure = 986.0;

        const alerts = [];
        const now = new Date(); // 18/09/2025, 12:30 PM CAT
        const forecastDate = new Date(now);
        forecastDate.setDate(now.getDate() + 2); // Previsão para 20/09/2025

        // Verificação de eventos extremos
        if (Math.max(apiTemp, dhtTemp) > 35) alerts.push({
            message: `Calor Extremo (>35°C) - Ação: Hidrate culturas`,
            icon: 'fas fa-temperature-high',
            time: now.toLocaleString('pt-PT', { hour: '2-digit', minute: '2-digit' })
        });
        if (Math.max(apiHumidity, dhtHumidity) > 90) alerts.push({
            message: `Umidade Crítica (>90%) - Ação: Verifique ventilação`,
            icon: 'fas fa-tint',
            time: now.toLocaleString('pt-PT', { hour: '2-digit', minute: '2-digit' })
        });
        if (apiWindGust > 20 || (apiWindGust === undefined && apiWindSpeed > 20)) alerts.push({
            message: `Rajadas Fortes (>20 km/h) - Ação: Reforce estruturas`,
            icon: 'fas fa-wind',
            time: now.toLocaleString('pt-PT', { hour: '2-digit', minute: '2-digit' })
        });
        if (Math.min(apiPressure, sensorPressure) < 1000 || Math.max(apiPressure, sensorPressure) > 1030) alerts.push({
            message: `Pressão Anormal (<1000 ou >1030 hPa) - Ação: Prepare-se para tempestade`,
            icon: 'fas fa-tachometer-alt',
            time: now.toLocaleString('pt-PT', { hour: '2-digit', minute: '2-digit' })
        });
        if (apiUV > 8) alerts.push({
            message: `Índice UV Extremo (>8) - Ação: Proteja trabalhadores`,
            icon: 'fas fa-sun',
            time: now.toLocaleString('pt-PT', { hour: '2-digit', minute: '2-digit' })
        });
        if (apiWindGust > 63 || (apiWindGust === undefined && apiWindSpeed > 63)) {
            alerts.push({
                message: `Tempestade Tropical (ventos >63 km/h) prevista para ${forecastDate.toLocaleDateString('pt-PT')} - Ação: Proteja plantações`,
                icon: 'fas fa-cloud-showers-heavy',
                time: now.toLocaleString('pt-PT', { hour: '2-digit', minute: '2-digit' })
            });
        }
        if (apiWindGust > 119 || (apiWindGust === undefined && apiWindSpeed > 119)) {
            alerts.push({
                message: `Ciclone Tropical (ventos >119 km/h) previsto para ${forecastDate.toLocaleDateString('pt-PT')} - Ação: Evacue áreas de risco`,
                icon: 'fas fa-hurricane',
                time: now.toLocaleString('pt-PT', { hour: '2-digit', minute: '2-digit' })
            });
        }
        if (apiPressure < 990) {
            alerts.push({
                message: `Possível Ciclone (pressão <990 hPa) previsto para ${forecastDate.toLocaleDateString('pt-PT')} - Ação: Reforce segurança`,
                icon: 'fas fa-hurricane',
                time: now.toLocaleString('pt-PT', { hour: '2-digit', minute: '2-digit' })
            });
        }

        alertsList.innerHTML = '';
        if (alerts.length === 0) {
            const div = document.createElement('div');
            div.className = 'alert-item';
            div.innerHTML = '<i class="fas fa-check-circle"></i> Nenhuma condição extrema detectada';
            alertsList.appendChild(div);
        } else {
            alerts.forEach(alert => {
                const div = document.createElement('div');
                div.className = 'alert-item';
                div.innerHTML = `<i class="${alert.icon}"></i> Alerta às ${alert.time} de ${now.toLocaleDateString('pt-PT')}: ${alert.message}`;
                alertsList.appendChild(div);
            });
        }
    }

    function updateSensors() {
        sensorsList.innerHTML = '';
        if (!isConnected) {
            const div = document.createElement('div');
            div.className = 'sensor-item no-connection';
            div.innerHTML = `<i class="fas fa-unlink"></i> Sem conexão`;
            sensorsList.appendChild(div);
            return;
        }

        const dhtTemp = 36.0;
        const dhtHumidity = 65.2;
        const pressure = 986.0;

        const sensors = [
            { label: 'Temperatura', value: `${dhtTemp}°C`, icon: 'fas fa-thermometer-half' },
            { label: 'Umidade', value: `${dhtHumidity}%`, icon: 'fas fa-tint' },
            { label: 'Pressão', value: `${pressure} hPa`, icon: 'fas fa-tachometer-alt' }
        ];

        sensors.forEach(sensor => {
            const div = document.createElement('div');
            div.className = 'sensor-item';
            div.innerHTML = `<i class="${sensor.icon}"></i> ${sensor.label}: ${sensor.value}`;
            sensorsList.appendChild(div);
        });
    }

    updateBtn.addEventListener('click', updateAlerts);

    setInterval(() => {
        isConnected = Math.random() > 0.3;
        updateSensors();
    }, 5000);

    updateAlerts();
    updateSensors();
});