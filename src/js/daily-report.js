document.addEventListener('DOMContentLoaded', function() {
    let dataTable;
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    const locationFilter = document.getElementById('locationFilter');
    const resetFiltersBtn = document.getElementById('resetFilters');

    // Initialize DataTable
    function initializeDataTable() {
        dataTable = $('#dailyReportTable').DataTable({
            ajax: {
                url: 'http://localhost:3000/api/daily-report',
                dataSrc: ''
            },
            columns: [
                { 
                    data: null,
                    render: function (data, type, row, meta) {
                        return meta.row + 1;
                    }
                },
                { 
                    data: 'datetime',
                    render: function(data) {
                        return new Date(data).toLocaleDateString('en-GB');
                    }
                },
                { data: 'activity' },
                { data: 'location' },
                { data: 'PIC' },
                { data: 'Description' },
                { 
                    data: 'status',
                    render: function(data) {
                        const statusClasses = {
                            'In Progress': 'status-in-progress',
                            'Completed': 'status-completed',
                            'Verified': 'status-verified'
                        };
                        return `<span class="status-badge ${statusClasses[data]}">${data}</span>`;
                    }
                },
                {
                    data: null,
                    render: function(data, type, row) {
                        let buttons = '';
                        if (row.status === 'In Progress') {
                            buttons += `<button class="btn btn-sm btn-success mr-1" onclick="updateStatus(${row.id}, 'Completed')">Complete</button>`;
                        } else if (row.status === 'Completed') {
                            buttons += `<button class="btn btn-sm btn-primary" onclick="updateStatus(${row.id}, 'Verified')">Verify</button>`;
                        }
                        return buttons;
                    }
                }
            ],
            order: [[1, 'desc']], // Sort by date descending
            pageLength: 25,
            responsive: true
        });
    }

    // Initialize filters
    function initializeFilters() {
        // Custom filtering function
        $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
            const status = statusFilter.value;
            const date = dateFilter.value;
            const location = locationFilter.value.toLowerCase();

            // Status filter
            if (status && data[6] !== status) return false;

            // Date filter
            if (date) {
                const rowDate = new Date(data[1].split('/').reverse().join('-')).toISOString().split('T')[0];
                if (rowDate !== date) return false;
            }

            // Location filter
            if (location && !data[3].toLowerCase().includes(location)) return false;

            return true;
        });

        // Add event listeners
        statusFilter.addEventListener('change', () => dataTable.draw());
        dateFilter.addEventListener('change', () => dataTable.draw());
        locationFilter.addEventListener('input', () => dataTable.draw());
        
        resetFiltersBtn.addEventListener('click', function() {
            statusFilter.value = '';
            dateFilter.value = '';
            locationFilter.value = '';
            dataTable.draw();
        });
    }

    // Update status function
    window.updateStatus = function(id, newStatus) {
        fetch(`http://localhost:3000/api/daily-report/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                dataTable.ajax.reload();
            } else {
                alert('Error updating status');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error updating status');
        });
    };

    // Initialize
    initializeDataTable();
    initializeFilters();
});