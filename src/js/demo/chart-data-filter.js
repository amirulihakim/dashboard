document.addEventListener("DOMContentLoaded", function () {
    const charts = []; // Store chart instances for updating
    
    // Define the specific sensor types we want to display
    const displayedSensorTypes = [
        'flow_rt',
        'velo_rt', 
        'flow_percent',
        'instant_heat',
        'temp_in',
        'temp_out'
    ];

    // Mapping sensor type keys to friendly labels
    const sensorLabels = {
        flow_rt: "Flow Rate (m³/h)",
        velo_rt: "Flow Velocity (m/s)",
        flow_percent: "Flow Percentage (%)",
        instant_heat: "Instantaneous Heat (GJ/h)",
        temp_in: "Input Temperature (°C)",
        temp_out: "Output Temperature (°C)"
    };

    // Add filter elements to the page
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filters-container mb-4 px-4';
    filterContainer.innerHTML = `
        <div class="row">
            <div class="col-md-4">
                <select id="deviceFilter" class="form-control">
                    <option value="1">PCWP</option>
                    <option value="2">SCWP 1</option>
                    <option value="3">SCWP 2</option>
                </select>
            </div>
            <div class="col-md-4">
                <select id="timeframeFilter" class="form-control">
                    <option value="hour">Last 1 Hour</option>
                    <option value="8hours">Last 8 Hours</option>
                    <option value="day">Day</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                </select>
            </div>
            <div class="col-md-4" id="specificDateContainer" style="display: none;">
                <input type="date" id="specificDateFilter" class="form-control">
            </div>
        </div>
    `;
    
    document.querySelector('.chart-grid').before(filterContainer);

    // Initialize filters
    const specificDateFilter = document.getElementById('specificDateFilter');
    const timeframeFilter = document.getElementById('timeframeFilter');
    const deviceFilter = document.getElementById('deviceFilter');
    const specificDateContainer = document.getElementById('specificDateContainer');

    // Event listeners for filters
    timeframeFilter.addEventListener('change', function() {
        const showDatePicker = ['day', 'month', 'year'].includes(this.value);
        specificDateContainer.style.display = showDatePicker ? 'block' : 'none';
        
        if (showDatePicker) {
            switch(this.value) {
                case 'day':
                    specificDateFilter.type = 'date';
                    break;
                case 'month':
                    specificDateFilter.type = 'month';
                    break;
                case 'year':
                    specificDateFilter.type = 'number';
                    specificDateFilter.min = '2000';
                    specificDateFilter.max = new Date().getFullYear().toString();
                    break;
            }
        }
        fetchAndUpdateCharts();
    });

    deviceFilter.addEventListener('change', fetchAndUpdateCharts);
    specificDateFilter.addEventListener('change', fetchAndUpdateCharts);

    function getTimeAxisConfiguration(timeframe) {
        const config = {
            type: 'time',
            time: {
                displayFormats: {
                    minute: 'HH:mm',
                    hour: 'HH:mm',
                    day: 'MMM D',
                    month: 'MMM YYYY'
                },
                tooltipFormat: 'll HH:mm'
            },
            scaleLabel: {
                display: true,
                labelString: 'Time'
            },
            ticks: {
                autoSkip: true,
                maxTicksLimit: 12
            }
        };

        switch(timeframe) {
            case 'hour':
                config.time.unit = 'minute';
                config.time.stepSize = 5;
                break;
            case '8hours':
                config.time.unit = 'hour';
                config.time.stepSize = 1;
                break;
            case 'day':
                config.time.unit = 'hour';
                config.time.stepSize = 2;
                break;
            case 'month':
                config.time.unit = 'day';
                config.time.stepSize = 1;
                break;
            case 'year':
                config.time.unit = 'month';
                config.time.stepSize = 1;
                break;
        }

        return config;
    }

    function fetchAndUpdateCharts() {
        const deviceId = deviceFilter.value;
        const timeframe = timeframeFilter.value;
        const specificDate = specificDateFilter.value;
        
        let url = `http://localhost:3000/api/filtered-data?deviceId=${deviceId}&timeframe=${timeframe}`;
        if (specificDate && ['day', 'month', 'year'].includes(timeframe)) {
            url += `&specificDate=${specificDate}`;
        }

        fetch(url)
            .then(response => response.json())
            .then(data => updateCharts(data))
            .catch(error => console.error("Error fetching data:", error));
    }

    function updateCharts(data) {
        // Destroy existing charts
        charts.forEach(chart => chart.destroy());
        charts.length = 0;
    
        const groupedData = groupDataBySensorType(data);
        const chartIds = ["chart1", "chart2", "chart3", "chart4", "chart5", "chart6"];
    
        // Update charts only for the specified sensor types
        displayedSensorTypes.forEach((sensorType, index) => {
            if (index >= chartIds.length) return; // Skip if we run out of chart containers
            
            const ctx = document.getElementById(chartIds[index]).getContext("2d");
            const sensorData = groupedData[sensorType] || [];
            
            const chartData = sensorData.map(item => ({
                x: moment(item.time).toDate(),
                y: item.avg_value,
            }));
    
            const values = sensorData.map(item => item.avg_value);
            const minValue = Math.min(...values) || 0;
            const maxValue = Math.max(...values) || 1;
            const padding = (maxValue - minValue) * 0.1 || 1;
    
            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: sensorLabels[sensorType] || sensorType,
                        data: chartData,
                        borderColor: getRandomColor(),
                        fill: false,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        xAxes: [getTimeAxisConfiguration(timeframeFilter.value)],
                        yAxes: [{
                            ticks: {
                                suggestedMin: minValue - padding,
                                suggestedMax: maxValue + padding
                            },
                            scaleLabel: {
                                display: true,
                                labelString: 'Average Value'
                            }
                        }]
                    }
                }
            });
            
            charts.push(chart);
        });
    }

    function groupDataBySensorType(data) {
        const grouped = {};
        data.forEach(item => {
            if (!grouped[item.sensor_type]) {
                grouped[item.sensor_type] = [];
            }
            grouped[item.sensor_type].push({
                time: item.time,
                avg_value: item.avg_value
            });
        });
        return grouped;
    }

    function getRandomColor() {
        return `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.7)`;
    }

    // Initial load
    fetchAndUpdateCharts();
});