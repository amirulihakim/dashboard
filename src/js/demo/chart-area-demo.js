// client.js
document.addEventListener("DOMContentLoaded", function () {
    const apiUrl = 'http://localhost:3000/api/realtime';

    const chartConfigs = {
        flowChart: { 
            label: "Flow Rate (m³/h)", 
            color: "rgb(255, 99, 132)",
            sensorType: "Flow Rate"
        },
        velocityChart: { 
            label: "Flow Velocity (m/s)", 
            color: "rgb(54, 162, 235)",
            sensorType: "Flow Velocity"
        },
        percentChart: { 
            label: "Flow Percentage (%)", 
            color: "rgb(255, 206, 86)",
            sensorType: "Flow Percentage"
        },
        heatChart: { 
            label: "Instantaneous Heat (GJ/h)", 
            color: "rgb(75, 192, 192)",
            sensorType: "Instant Heat"
        },
        inputTempChart: { 
            label: "Input Temperature (°C)", 
            color: "rgb(153, 102, 255)",
            sensorType: "Input Temperature"
        },
        outputTempChart: { 
            label: "Output Temperature (°C)", 
            color: "rgb(255, 159, 64)",
            sensorType: "Output Temperature"
        }
    };

    const charts = {};
    const chartData = {};

    // Initialize data structures for each chart
    Object.keys(chartConfigs).forEach(chartId => {
        chartData[chartId] = new Map(); // Using Map to store timestamp -> value pairs
    });

    // Initialize Charts
    Object.keys(chartConfigs).forEach(chartId => {
        const canvas = document.getElementById(chartId);
        if (canvas) {
            const ctx = canvas.getContext("2d");
            charts[chartId] = new Chart(ctx, {
                type: "line",
                data: {
                    datasets: [{
                        label: chartConfigs[chartId].label,
                        data: [],
                        borderColor: chartConfigs[chartId].color,
                        backgroundColor: chartConfigs[chartId].color.replace("rgb", "rgba").replace(")", ", 0.2)"),
                        fill: true,
                        tension: 0.2,
                        pointRadius: 2, // Set point radius to make points visible
                        pointHoverRadius: 4, // Increase radius when hovering over a point
                        pointBackgroundColor: chartConfigs[chartId].color, // Match point color with line
                    }]
                },
                options: {
                    animation: false,
                    scales: {
                        xAxes: [{
                            type: 'time',
                            time: {
                                unit: 'second',
                                displayFormats: {
                                    second: 'HH:mm:ss'
                                }
                            },
                            ticks: {
                                maxTicksLimit: 6,
                                maxRotation: 0,
                                minRotation: 0
                            }
                        }],
                        yAxes: [{
                            ticks: {
                                beginAtZero: false,
                                maxTicksLimit: 5
                            },
                        }]
                    },
                    responsive: true,
                    maintainAspectRatio: true,
                    elements: {
                        line: { tension: 0.4 }
                    }
                }
            });
        }
    });

    async function updateCharts() {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            
            // Process each data point
            data.forEach(record => {
                const chartId = Object.keys(chartConfigs).find(
                    id => chartConfigs[id].sensorType === record.sensor_type
                );

                if (chartId) {
                    chartData[chartId].set(record.timestamp, record.reading);
                }
            });

            // Update each chart
            const now = Date.now();
            const cutoff = now - 60000; // 60 seconds ago

            Object.keys(charts).forEach(chartId => {
                const chart = charts[chartId];
                const dataMap = chartData[chartId];

                // Remove old data points
                for (let [timestamp] of dataMap) {
                    if (timestamp < cutoff) {
                        dataMap.delete(timestamp);
                    }
                }

                // Convert Map to sorted arrays for Chart.js
                const sortedData = Array.from(dataMap.entries())
                    .sort((a, b) => a[0] - b[0]);

                chart.data.datasets[0].data = sortedData.map(([timestamp, value]) => ({
                    x: timestamp,
                    y: value
                }));

                chart.update('none');
            });
        } catch (error) {
            console.error("Error fetching real-time data:", error);
        }
    }

    // Initial update
    updateCharts();

    // Update every second
    setInterval(updateCharts, 1000);
});